const admin = require('firebase-admin');

// Firebase Admin 초기화 (함수에서 한 번만)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 자동 리더보드 집계 함수
 * 매일 자동으로 실행되어 리더보드를 생성합니다.
 */
exports.generateLeaderboard = async () => {
  console.log('🚀 자동 리더보드 집계 시작:', new Date().toISOString());

  try {
    // 모든 학생 조회
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    console.log(`📊 총 학생 수: ${studentsSnapshot.size}`);

    if (studentsSnapshot.empty) {
      console.log('❌ 학생 데이터가 없습니다.');
      return { success: false, message: '학생 데이터가 없습니다.' };
    }

    const now = new Date();
    const periods = [
      { name: 'all', startDate: new Date(0), label: '전체' },
      { name: 'weekly', startDate: getWeekStart(now), label: '이번 주' },
      { name: 'monthly', startDate: getMonthStart(now), label: '이번 달' }
    ];

    let totalGenerated = 0;

    // 각 기간별로 리더보드 생성
    for (const period of periods) {
      console.log(`\n📈 ${period.label} 리더보드 생성 중...`);
      
      const leaderboardData = [];
      
      // 각 학생별로 점수 계산
      for (const userDoc of studentsSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        try {
          // 해당 기간의 세션 조회
          const sessions = await getUserSessions(userId, period.startDate);
          
          // 점수 계산
          const scoreData = calculateScore(sessions);
          
          leaderboardData.push({
            userId,
            name: userData.name || '익명',
            school: userData.school || '',
            grade: userData.grade || '',
            classNum: userData.classNum || '',
            score: scoreData.score,
            breakdown: scoreData.breakdown,
            sessionCount: sessions.length,
            lastSessionDate: sessions.length > 0 ? 
              (sessions[0].created_at?.toDate?.() || sessions[0].created_at) : null,
            generatedAt: now
          });
        } catch (error) {
          console.error(`❌ ${userData.name} 처리 중 오류:`, error);
          // 오류가 있어도 계속 진행
        }
      }
      
      // 점수순 정렬 및 순위 부여
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // 전체 리더보드 저장
      const allLeaderboardId = `${period.name}_all_${now.toISOString().split('T')[0]}`;
      await db.collection('leaderboard').doc(allLeaderboardId).set({
        period: period.name,
        scope: 'all',
        data: leaderboardData.slice(0, 50), // 상위 50명만
        totalParticipants: leaderboardData.length,
        generatedAt: now,
        lastUpdated: now,
        isPublic: true
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
        
        const schoolLeaderboardId = `${period.name}_${school}_${now.toISOString().split('T')[0]}`;
        await db.collection('leaderboard').doc(schoolLeaderboardId).set({
          period: period.name,
          scope: school,
          data: schoolData,
          totalParticipants: schoolData.length,
          generatedAt: now,
          lastUpdated: now,
          isPublic: true
        });
        
        console.log(`✅ ${period.label} ${school} 리더보드 저장 완료 (${schoolData.length}명)`);
        totalGenerated++;
      }
    }

    console.log(`\n🎉 총 ${totalGenerated}개의 리더보드 생성 완료`);
    
    return { 
      success: true, 
      message: `${totalGenerated}개의 리더보드가 생성되었습니다.`,
      totalGenerated 
    };

  } catch (error) {
    console.error('❌ 리더보드 집계 오류:', error);
    return { success: false, error: error.message };
  }
};

// 사용자 세션 조회
async function getUserSessions(userId, startDate) {
  try {
    let query = db.collection('sessions').where('user_id', '==', userId);
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
  } catch (error) {
    console.error(`세션 조회 오류 (${userId}):`, error);
    return [];
  }
}

// 점수 계산
function calculateScore(sessions) {
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
function calculateStreak(sessions) {
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
function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

// 월의 시작일 계산
function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}