import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

// 개선된 점수 계산 함수들을 import
import { calculateImprovedScore } from '@/lib/leaderboard-scoring';

// 리더보드 조회
export async function GET(request: NextRequest) {
  try {
    console.log('리더보드 API 시작');
    const firestore = getFirebaseAdminFirestore();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const period = parseInt(searchParams.get('period') || '0'); // 0: 전체, 1: 주간, 2: 월간, 3: 학교별
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('파라미터:', { userId, period, limit });

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 조회
    console.log('사용자 조회 시작:', userId);
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('사용자를 찾을 수 없음:', userId);
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const currentUser = userDoc.data();
    console.log('현재 사용자:', currentUser);
    
    // 기간 설정
    let startDate = new Date(0); // 기본은 전체 기간
    const now = new Date();
    
    switch (period) {
      case 1: // 이번 주
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart;
        break;
      case 2: // 이번 달
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 3: // 내 학교 (학교 기준)
        // 학교별 필터링은 아래에서 처리
        break;
    }

    // 사용자 목록 조회 (학생만)
    let usersQuery = firestore.collection('users').where('role', '==', 'student');
    
    // 학교별 조회인 경우 같은 학교 학생들만
    if (period === 3 && currentUser && currentUser.school) {
      console.log('학교별 필터링:', currentUser.school);
      usersQuery = usersQuery.where('school', '==', currentUser.school);
    }

    console.log('사용자 쿼리 실행');
    const usersSnapshot = await usersQuery.get();
    console.log('조회된 사용자 수:', usersSnapshot.size);
    
    // 각 사용자별 점수 계산
    const leaderboardData = await Promise.all(
      usersSnapshot.docs.map(async (userDocRef) => {
        const userData = userDocRef.data();
        console.log('사용자 처리 중:', userData.name, userDocRef.id);
        
        const userSessions = await getUserSessions(userDocRef.id, startDate);
        console.log('세션 수:', userSessions.length);
        
        // 개선된 점수 계산
        const scoreData = calculateImprovedScore(userSessions);
        console.log('점수 계산 완료:', scoreData.score);
        
        return {
          rank: 0, // 나중에 정렬 후 설정
          userId: userDocRef.id,
          name: userData.name || '익명',
          school: userData.school || '',
          grade: userData.grade || '',
          classNum: userData.classNum || '',
          score: scoreData.score,
          breakdown: scoreData.breakdown,
          isCurrentUser: userDocRef.id === userId
        };
      })
    );

    // 점수순으로 정렬하고 순위 설정
    const sortedLeaderboard = leaderboardData
      .filter(entry => entry.score > 0) // 점수가 0인 사용자 제외
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))
      .slice(0, limit);

    // 현재 사용자의 순위 찾기
    const myRank = sortedLeaderboard.find(entry => entry.isCurrentUser) || null;

    return NextResponse.json({
      success: true,
      leaderboard: sortedLeaderboard,
      myRank,
      period: ['전체', '이번 주', '이번 달', '내 학교'][period],
      totalParticipants: leaderboardData.filter(entry => entry.score > 0).length
    });

  } catch (error) {
    console.error('리더보드 조회 오류:', error);
    return NextResponse.json(
      { error: '리더보드를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 세션 데이터 조회
async function getUserSessions(userId: string, startDate: Date) {
  try {
    const { db: firestore } = getFirebaseInstance();
    
    let query = firestore
      .collection('sessions')
      .where('user_id', '==', userId);
    
    // 기간 필터 적용
    if (startDate.getTime() > 0) {
      query = query.where('created_at', '>=', startDate);
    }
    
    const snapshot = await query
      .orderBy('created_at', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at)
      };
    });
  } catch (error) {
    console.error(`사용자 ${userId} 세션 조회 오류:`, error);
    return [];
  }
}

