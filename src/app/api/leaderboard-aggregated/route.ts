import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseInstance } from '@/lib/firebase';

// 집계된 리더보드 조회
export async function GET(request: NextRequest) {
  try {
    console.log('집계된 리더보드 API 시작');
    const { db: firestore } = getFirebaseInstance();
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
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const currentUser = userDoc.data();
    console.log('현재 사용자:', currentUser);

    // 기간 매핑
    const periodMap: Record<number, string> = {
      0: 'all',
      1: 'weekly', 
      2: 'monthly',
      3: 'all' // 학교별의 경우 전체 기간에서 학교로 필터링
    };

    const periodName = periodMap[period] || 'all';
    
    // 스코프 결정 (전체 vs 학교별)
    let scope = 'all';
    if (period === 3 && currentUser?.school) {
      scope = currentUser.school;
    }

    // 문서 ID 패턴으로 직접 조회 (인덱스 문제 회피)
    console.log('집계 데이터 조회:', { period: periodName, scope });
    
    // 가능한 날짜들로 시도 (오늘부터 최근 7일)
    const today = new Date();
    const possibleDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      possibleDates.push(date.toISOString().split('T')[0]);
    }
    
    let aggregatedDoc = null;
    
    for (const dateStr of possibleDates) {
      const docId = `${periodName}_${scope}_${dateStr}`;
      console.log(`문서 ID 시도: ${docId}`);
      
      const doc = await firestore.collection('leaderboardAggregated').doc(docId).get();
      if (doc.exists) {
        aggregatedDoc = doc;
        console.log(`집계 데이터 발견: ${docId}`);
        break;
      }
    }
    
    if (!aggregatedDoc) {
      console.log('집계 데이터 없음, 실시간 집계 수행');
      // 집계 데이터가 없으면 실시간으로 생성
      return await generateRealTimeLeaderboard(userId, period, currentUser, limit);
    }

    const aggregatedData = aggregatedDoc.data();
    const leaderboardData = aggregatedData?.data || [];
    
    console.log('집계된 리더보드 데이터 수:', leaderboardData.length);

    // 내 순위 찾기
    const myRank = leaderboardData.find((entry: any) => entry.userId === userId);
    
    // 상위 N명 + 내 순위 (상위권에 없는 경우)
    let finalLeaderboard = leaderboardData.slice(0, limit);
    
    if (myRank && myRank.rank > limit) {
      // 내가 상위권에 없으면 추가
      myRank.isCurrentUser = true;
      finalLeaderboard.push(myRank);
    } else if (myRank) {
      // 내가 상위권에 있으면 표시
      finalLeaderboard = finalLeaderboard.map((entry: any) => ({
        ...entry,
        isCurrentUser: entry.userId === userId
      }));
    }

    return NextResponse.json({
      success: true,
      leaderboard: finalLeaderboard,
      myRank: myRank ? {
        ...myRank,
        isCurrentUser: true
      } : null,
      period: ['전체', '이번 주', '이번 달', '내 학교'][period],
      totalParticipants: aggregatedData?.totalParticipants || 0,
      lastUpdated: aggregatedData?.lastUpdated?.toDate?.() || aggregatedData?.lastUpdated,
      isRealTime: false
    });

  } catch (error) {
    console.error('집계된 리더보드 조회 오류:', error);
    return NextResponse.json(
      { error: '리더보드를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 실시간 리더보드 생성 (집계 데이터가 없을 때)
async function generateRealTimeLeaderboard(userId: string, period: number, currentUser: any, limit: number) {
  try {
    console.log('실시간 리더보드 생성');
    const { db: firestore } = getFirebaseInstance();
    
    // 제한적이지만 실제 데이터로 계산
    const studentsSnapshot = await firestore.collection('users').where('role', '==', 'student').limit(10).get();
    const realTimeLeaderboard = [];
    
    for (const userDoc of studentsSnapshot.docs) {
      const userData = userDoc.data();
      const userSessions = await getUserSessionsSimple(firestore, userDoc.id);
      
      // 간단한 점수 계산
      const score = Math.min(100, userSessions.length * 10); // 세션 수 * 10
      
      realTimeLeaderboard.push({
        rank: 0, // 나중에 설정
        userId: userDoc.id,
        name: userData.name || '익명',
        school: userData.school || '',
        score,
        breakdown: {
          consistency: Math.round(score * 0.4),
          quality: Math.round(score * 0.35),
          engagement: Math.round(score * 0.15),
          streak: Math.round(score * 0.1)
        },
        isCurrentUser: userDoc.id === userId
      });
    }
    
    // 점수순 정렬 및 순위 부여
    realTimeLeaderboard.sort((a, b) => b.score - a.score);
    realTimeLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    const myRank = realTimeLeaderboard.find(entry => entry.userId === userId);
    
    return NextResponse.json({
      success: true,
      leaderboard: realTimeLeaderboard.slice(0, limit),
      myRank,
      period: ['전체', '이번 주', '이번 달', '내 학교'][period],
      totalParticipants: realTimeLeaderboard.length,
      lastUpdated: new Date(),
      isRealTime: true,
      message: '임시 리더보드입니다. 정확한 순위는 집계 후 제공됩니다.'
    });

  } catch (error) {
    console.error('실시간 리더보드 생성 오류:', error);
    
    // 에러 발생시 최소한의 데이터 반환
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    const fallbackRank = {
      rank: 1,
      userId: userId,
      name: userData?.name || '나',
      school: userData?.school || '',
      score: 0,
      breakdown: { consistency: 0, quality: 0, engagement: 0, streak: 0 },
      isCurrentUser: true
    };

    return NextResponse.json({
      success: true,
      leaderboard: [fallbackRank],
      myRank: fallbackRank,
      period: ['전체', '이번 주', '이번 달', '내 학교'][period],
      totalParticipants: 1,
      lastUpdated: new Date(),
      isRealTime: true,
      message: '리더보드를 불러오는 중 오류가 발생했습니다.'
    });
  }
}

// 간단한 세션 조회 (실시간용)
async function getUserSessionsSimple(firestore: any, userId: string) {
  try {
    const snapshot = await firestore.collection('sessions').where('user_id', '==', userId).limit(20).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('세션 조회 오류:', error);
    return [];
  }
}