const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function aggregateLeaderboard() {
  console.log('📊 일일 리더보드 집계 시작...', new Date().toISOString());

  try {
    const admin = require('firebase-admin');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }

    const db = admin.firestore();
    
    // 모든 학생 사용자 조회
    console.log('👥 학생 사용자 조회 중...');
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    console.log(`총 ${studentsSnapshot.size}명의 학생 발견`);

    const today = new Date();
    const aggregationDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // 기간별 집계 생성
    const periods = [
      { name: 'all', startDate: new Date(0), label: '전체' },
      { name: 'weekly', startDate: getWeekStart(today), label: '이번 주' },
      { name: 'monthly', startDate: getMonthStart(today), label: '이번 달' }
    ];

    for (const period of periods) {
      console.log(`\n📈 ${period.label} 집계 처리 중...`);
      
      const leaderboardData = [];
      
      for (const userDoc of studentsSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // 해당 기간의 세션 조회
        const sessions = await getUserSessions(db, userId, period.startDate);
        
        // 점수 계산
        const scoreData = calculateScore(sessions);
        
        leaderboardData.push({
          userId,
          name: userData.name,
          school: userData.school || '',
          grade: userData.grade || '',
          classNum: userData.classNum || '',
          score: scoreData.score,
          breakdown: scoreData.breakdown,
          sessionCount: sessions.length,
          lastSessionDate: sessions.length > 0 ? sessions[0].created_at?.toDate?.() || sessions[0].created_at : null
        });
      }
      
      // 점수순 정렬
      leaderboardData.sort((a, b) => b.score - a.score);
      
      // 순위 부여
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // 전체 리더보드 저장
      await saveLeaderboard(db, period.name, 'all', leaderboardData, aggregationDate);
      console.log(`✅ ${period.label} 전체 리더보드 저장 완료 (${leaderboardData.length}명)`);
      
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
        
        await saveLeaderboard(db, period.name, school, schoolData, aggregationDate);
        console.log(`✅ ${period.label} ${school} 리더보드 저장 완료 (${schoolData.length}명)`);
      }
    }

    console.log('\n🎉 일일 리더보드 집계 완료!');

  } catch (error) {
    console.error('❌ 집계 오류:', error);
    throw error;
  }
}

// 사용자 세션 조회 (인덱스 문제 해결을 위해 단순화)
async function getUserSessions(db, userId, startDate) {
  const query = db.collection('sessions').where('user_id', '==', userId);
  const snapshot = await query.get();
  
  let sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // 클라이언트 쪽에서 날짜 필터링
  if (startDate && startDate.getTime() > 0) {
    sessions = sessions.filter(session => {
      const sessionDate = session.created_at?.toDate?.() ? 
        session.created_at.toDate() : new Date(session.created_at);
      return sessionDate >= startDate;
    });
  }
  
  // 클라이언트 쪽에서 정렬
  sessions.sort((a, b) => {
    const dateA = a.created_at?.toDate?.() ? a.created_at.toDate() : new Date(a.created_at);
    const dateB = b.created_at?.toDate?.() ? b.created_at.toDate() : new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sessions;
}

// 점수 계산 (기존 로직 복사)
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
  }))].sort((a, b) => new Date(b) - new Date(a));
  
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const previous = new Date(dates[i-1]);
    const diffDays = Math.floor((previous - current) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// 리더보드 저장
async function saveLeaderboard(db, period, scope, data, aggregationDate) {
  const docId = `${period}_${scope}_${aggregationDate.toISOString().split('T')[0]}`;
  
  await db.collection('leaderboardAggregated').doc(docId).set({
    period,
    scope,
    aggregationDate,
    lastUpdated: new Date(),
    totalParticipants: data.length,
    data: data.slice(0, 50) // 상위 50명만 저장
  });
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

// 직접 실행
if (require.main === module) {
  aggregateLeaderboard()
    .then(() => {
      console.log('스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('스크립트 실행 오류:', error);
      process.exit(1);
    });
}

module.exports = { aggregateLeaderboard };