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

    // 오늘 날짜로 집계 데이터 조회 (없으면 가장 최근 데이터)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let docId = `${periodName}_${scope}_${todayStr}`;
    
    console.log('집계 문서 ID:', docId);
    
    let aggregatedDoc = await firestore.collection('leaderboardAggregated').doc(docId).get();
    
    // 오늘 데이터가 없으면 가장 최근 데이터 조회
    if (!aggregatedDoc.exists) {
      console.log('오늘 집계 데이터 없음, 최근 데이터 조회');
      const recentSnapshot = await firestore
        .collection('leaderboardAggregated')
        .where('period', '==', periodName)
        .where('scope', '==', scope)
        .orderBy('aggregationDate', 'desc')
        .limit(1)
        .get();
      
      if (!recentSnapshot.empty) {
        aggregatedDoc = recentSnapshot.docs[0];
        console.log('최근 집계 데이터 사용:', aggregatedDoc.id);
      } else {
        console.log('집계 데이터 없음, 실시간 집계 수행');
        // 집계 데이터가 없으면 실시간으로 생성
        return await generateRealTimeLeaderboard(userId, period, currentUser, limit);
      }
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
    
    // 간단한 실시간 계산 (성능상 제한적)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // 최소한의 내 정보만 반환
    const myRank = {
      rank: 1,
      userId: userId,
      name: userData?.name || '나',
      school: userData?.school || '',
      score: 50, // 기본 점수
      breakdown: {
        consistency: 50,
        quality: 50,
        engagement: 50,
        streak: 50
      },
      isCurrentUser: true
    };

    return NextResponse.json({
      success: true,
      leaderboard: [myRank],
      myRank,
      period: ['전체', '이번 주', '이번 달', '내 학교'][period],
      totalParticipants: 1,
      lastUpdated: new Date(),
      isRealTime: true,
      message: '리더보드를 준비 중입니다. 잠시 후 다시 시도해주세요.'
    });

  } catch (error) {
    console.error('실시간 리더보드 생성 오류:', error);
    throw error;
  }
}