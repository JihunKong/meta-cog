import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseInstance } from '@/lib/firebase';

// 자동 집계된 리더보드 조회 (모든 사용자 접근 가능)
export async function GET(request: NextRequest) {
  try {
    console.log('자동 집계 리더보드 조회 API 시작');
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
    console.log('현재 사용자:', currentUser.name);

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

    console.log('조회 기준:', { period: periodName, scope });

    // 가능한 날짜들로 시도 (최근 7일)
    const today = new Date();
    const possibleDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      possibleDates.push(date.toISOString().split('T')[0]);
    }
    
    let leaderboardDoc = null;
    
    for (const dateStr of possibleDates) {
      const docId = `${periodName}_${scope}_${dateStr}`;
      console.log(`리더보드 문서 ID 시도: ${docId}`);
      
      const doc = await firestore.collection('leaderboard').doc(docId).get();
      if (doc.exists) {
        leaderboardDoc = doc;
        console.log(`리더보드 발견: ${docId}`);
        break;
      }
    }
    
    if (!leaderboardDoc) {
      console.log('자동 집계 리더보드 없음');
      
      // 리더보드가 없으면 Firebase Functions를 통해 즉시 생성 시도
      try {
        console.log('Firebase Functions를 통한 즉시 생성 시도');
        const functionsUrl = `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/generateLeaderboardNow`;
        
        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          console.log('리더보드 즉시 생성 성공, 재조회 시도');
          
          // 생성 후 다시 조회 시도
          for (const dateStr of possibleDates) {
            const docId = `${periodName}_${scope}_${dateStr}`;
            const doc = await firestore.collection('leaderboard').doc(docId).get();
            if (doc.exists) {
              leaderboardDoc = doc;
              break;
            }
          }
        }
      } catch (error) {
        console.log('Firebase Functions 호출 실패:', error);
      }
    }
    
    if (!leaderboardDoc) {
      // 여전히 데이터가 없으면 기본 응답
      const defaultRank = {
        rank: 1,
        userId: userId,
        name: currentUser.name || '나',
        school: currentUser.school || '',
        score: 0,
        breakdown: { consistency: 0, quality: 0, engagement: 0, streak: 0 },
        isCurrentUser: true
      };

      return NextResponse.json({
        success: true,
        leaderboard: [defaultRank],
        myRank: defaultRank,
        period: ['전체', '이번 주', '이번 달', '내 학교'][period],
        totalParticipants: 1,
        lastUpdated: new Date(),
        isGenerated: false,
        message: '리더보드를 생성 중입니다. 잠시 후 다시 확인해주세요.'
      });
    }

    const leaderboardData = leaderboardDoc.data();
    const rankingData = leaderboardData?.data || [];
    
    console.log(`자동 집계 리더보드 데이터 수: ${rankingData.length}`);

    // 내 순위 찾기
    const myRank = rankingData.find((entry: any) => entry.userId === userId);
    
    // 상위 N명 + 내 순위 (상위권에 없는 경우)
    let finalLeaderboard = rankingData.slice(0, limit);
    
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

    // 내 순위가 없으면 기본 정보 생성
    const finalMyRank = myRank ? {
      ...myRank,
      isCurrentUser: true
    } : {
      rank: rankingData.length + 1,
      userId: userId,
      name: currentUser.name || '나',
      school: currentUser.school || '',
      score: 0,
      breakdown: { consistency: 0, quality: 0, engagement: 0, streak: 0 },
      isCurrentUser: true
    };

    return NextResponse.json({
      success: true,
      leaderboard: finalLeaderboard,
      myRank: finalMyRank,
      period: ['전체', '이번 주', '이번 달', '내 학교'][period],
      totalParticipants: leaderboardData?.totalParticipants || 0,
      lastUpdated: leaderboardData?.lastUpdated?.toDate?.() || leaderboardData?.lastUpdated,
      isGenerated: true,
      message: null
    });

  } catch (error) {
    console.error('자동 집계 리더보드 조회 오류:', error);
    return NextResponse.json(
      { error: '리더보드를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}