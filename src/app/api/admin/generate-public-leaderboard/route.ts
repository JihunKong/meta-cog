import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseInstance } from '@/lib/firebase';

// 교사/관리자 권한으로 공개 리더보드 생성
export async function POST(request: NextRequest) {
  try {
    console.log('공개 리더보드 생성 API 시작');
    const { db: firestore } = getFirebaseInstance();
    const body = await request.json();
    
    const { requesterId } = body;

    if (!requesterId) {
      return NextResponse.json(
        { error: '요청자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 요청자 권한 확인 (교사 또는 관리자만 가능)
    console.log('권한 확인:', requesterId);
    const requesterDoc = await firestore.collection('users').doc(requesterId).get();
    
    if (!requesterDoc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const requesterData = requesterDoc.data();
    console.log('요청자 역할:', requesterData.role);
    
    if (!['teacher', 'admin'].includes(requesterData.role)) {
      return NextResponse.json(
        { error: '교사 또는 관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 모든 학생 데이터 조회 (교사 권한으로)
    console.log('모든 학생 데이터 조회 시작');
    const studentsSnapshot = await firestore.collection('users').where('role', '==', 'student').get();
    console.log(`총 학생 수: ${studentsSnapshot.size}`);

    const now = new Date();
    const periods = [
      { name: 'all', startDate: new Date(0), label: '전체' },
      { name: 'weekly', startDate: getWeekStart(now), label: '이번 주' },
      { name: 'monthly', startDate: getMonthStart(now), label: '이번 달' }
    ];

    let totalGenerated = 0;

    for (const period of periods) {
      console.log(`\n📊 ${period.label} 리더보드 생성 중...`);
      
      const leaderboardData = [];
      
      for (const userDoc of studentsSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        console.log(`처리 중: ${userData.name}`);
        
        // 해당 기간의 세션 조회 (교사 권한으로 모든 세션 접근 가능)
        const sessions = await getUserSessions(firestore, userId, period.startDate);
        console.log(`${userData.name}의 세션 수: ${sessions.length}`);
        
        // 점수 계산
        const scoreData = calculateDetailedScore(sessions);
        
        leaderboardData.push({
          userId,
          name: userData.name,
          school: userData.school || '',
          grade: userData.grade || '',
          classNum: userData.classNum || '',
          score: scoreData.score,
          breakdown: scoreData.breakdown,
          sessionCount: sessions.length,
          lastSessionDate: sessions.length > 0 ? sessions[0].created_at?.toDate?.() || sessions[0].created_at : null,
          generatedAt: now,
          generatedBy: requesterId
        });
      }
      
      // 점수순 정렬 및 순위 부여
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // 전체 리더보드 저장 (공개용)
      const allLeaderboardId = `public_${period.name}_all_${now.toISOString().split('T')[0]}`;
      await firestore.collection('publicLeaderboard').doc(allLeaderboardId).set({
        period: period.name,
        scope: 'all',
        data: leaderboardData,
        totalParticipants: leaderboardData.length,
        generatedAt: now,
        generatedBy: requesterId,
        isPublic: true,
        lastUpdated: now
      });
      
      console.log(`✅ ${period.label} 전체 리더보드 저장 완료 (${leaderboardData.length}명)`);
      totalGenerated++;
      
      // 학교별 리더보드 생성
      const schoolGroups = {};
      leaderboardData.forEach(entry => {
        if (entry.school) {
          if (!schoolGroups[entry.school]) {
            schoolGroups[entry.school] = [];
          }
          schoolGroups[entry.school].push(entry);
        }
      });
      
      for (const [school, schoolData] of Object.entries(schoolGroups)) {
        // 학교 내 순위 재부여
        schoolData.forEach((entry, index) => {
          entry.schoolRank = index + 1;
        });
        
        const schoolLeaderboardId = `public_${period.name}_${school}_${now.toISOString().split('T')[0]}`;
        await firestore.collection('publicLeaderboard').doc(schoolLeaderboardId).set({
          period: period.name,
          scope: school,
          data: schoolData,
          totalParticipants: schoolData.length,
          generatedAt: now,
          generatedBy: requesterId,
          isPublic: true,
          lastUpdated: now
        });
        
        console.log(`✅ ${period.label} ${school} 리더보드 저장 완료 (${schoolData.length}명)`);
        totalGenerated++;
      }
    }

    console.log(`\n🎉 총 ${totalGenerated}개의 공개 리더보드 생성 완료`);

    return NextResponse.json({
      success: true,
      message: '공개 리더보드가 성공적으로 생성되었습니다.',
      totalGenerated,
      generatedAt: now,
      generatedBy: requesterData.name
    });

  } catch (error) {
    console.error('공개 리더보드 생성 오류:', error);
    return NextResponse.json(
      { error: '리더보드 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 세션 조회 (교사 권한으로)
async function getUserSessions(firestore: any, userId: string, startDate: Date) {
  let query = firestore.collection('sessions').where('user_id', '==', userId);
  
  const snapshot = await query.get();
  let sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // 날짜 필터링
  if (startDate && startDate.getTime() > 0) {
    sessions = sessions.filter(session => {
      const sessionDate = session.created_at?.toDate?.() ? 
        session.created_at.toDate() : new Date(session.created_at);
      return sessionDate >= startDate;
    });
  }
  
  // 날짜순 정렬
  sessions.sort((a, b) => {
    const dateA = a.created_at?.toDate?.() ? a.created_at.toDate() : new Date(a.created_at);
    const dateB = b.created_at?.toDate?.() ? b.created_at.toDate() : new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sessions;
}

// 상세 점수 계산
function calculateDetailedScore(sessions: any[]) {
  if (!sessions || sessions.length === 0) {
    return {
      score: 0,
      breakdown: { consistency: 0, quality: 0, engagement: 0, streak: 0 }
    };
  }

  // 1. 일관성 점수 (40%)
  const uniqueDates = new Set();
  sessions.forEach(session => {
    const date = session.created_at?.toDate?.() ? 
      session.created_at.toDate() : new Date(session.created_at);
    uniqueDates.add(date.toDateString());
  });
  
  const daysActive = uniqueDates.size;
  const consistencyScore = Math.min(100, (daysActive / 30) * 100);

  // 2. 품질 점수 (35%) - 반성의 질
  let qualitySum = 0;
  let qualityCount = 0;
  
  sessions.forEach(session => {
    if (session.reflection && session.reflection.trim().length > 0) {
      let quality = 0;
      const reflection = session.reflection.trim();
      
      if (reflection.length >= 20) quality += 40;
      if (reflection.length >= 50) quality += 30;
      if (reflection.includes('학습') || reflection.includes('공부') || 
          reflection.includes('이해') || reflection.includes('문제')) quality += 30;
      
      qualitySum += Math.min(100, quality);
      qualityCount++;
    }
  });
  
  const qualityScore = qualityCount > 0 ? qualitySum / qualityCount : 0;

  // 3. 적정 참여 점수 (15%)
  const totalSessions = Math.min(30, sessions.length);
  const engagementScore = (totalSessions / 30) * 100;

  // 4. 연속 학습 점수 (10%)
  const streak = calculateStreak(sessions);
  const streakScore = Math.min(100, (streak / 7) * 100);

  // 총점 계산
  const totalScore = Math.round(
    (consistencyScore * 0.4) + 
    (qualityScore * 0.35) + 
    (engagementScore * 0.15) + 
    (streakScore * 0.1)
  );

  return {
    score: totalScore,
    breakdown: {
      consistency: Math.round(consistencyScore),
      quality: Math.round(qualityScore),
      engagement: Math.round(engagementScore),
      streak: Math.round(streakScore)
    }
  };
}

// 연속 학습 일수 계산
function calculateStreak(sessions: any[]) {
  if (!sessions || sessions.length === 0) return 0;
  
  const dates = [...new Set(sessions.map(session => {
    const date = session.created_at?.toDate?.() ? 
      session.created_at.toDate() : new Date(session.created_at);
    return date.toDateString();
  }))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const previous = new Date(dates[i-1]);
    const diffDays = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// 주의 시작일 계산
function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

// 월의 시작일 계산
function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}