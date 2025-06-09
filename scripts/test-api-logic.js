const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testApiLogic() {
  console.log('🧪 API 로직 테스트...');

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

    // API 파라미터 시뮬레이션
    const userId = 'WyQ7hhZS18gGYbxiYV383eYw9Ua2';
    const period = 0; // 전체

    console.log('API 파라미터:', { userId, period });

    // 현재 사용자 정보 조회
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ 사용자를 찾을 수 없습니다.');
      return;
    }

    const currentUser = userDoc.data();
    console.log('현재 사용자:', currentUser.name, currentUser.school);

    // 기간 매핑
    const periodMap = {
      0: 'all',
      1: 'weekly', 
      2: 'monthly',
      3: 'all'
    };

    const periodName = periodMap[period] || 'all';
    
    // 스코프 결정
    let scope = 'all';
    if (period === 3 && currentUser?.school) {
      scope = currentUser.school;
    }

    console.log('조회 기준:', { period: periodName, scope });

    // 가능한 날짜들로 시도
    const today = new Date();
    const possibleDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      possibleDates.push(date.toISOString().split('T')[0]);
    }

    console.log('시도할 날짜들:', possibleDates.slice(0, 3));

    let leaderboardDoc = null;
    
    for (const dateStr of possibleDates) {
      const scopeStr = scope === 'all' ? 'all' : scope;
      const docId = `${periodName}_${scopeStr}_${dateStr}`;
      console.log(`문서 ID 시도: ${docId}`);
      
      const doc = await db.collection('leaderboard').doc(docId).get();
      if (doc.exists) {
        leaderboardDoc = doc;
        console.log(`✅ 리더보드 발견: ${docId}`);
        
        const data = doc.data();
        console.log(`데이터 요약: ${data.totalParticipants}명, 최근 업데이트: ${data.lastUpdated?.toDate?.()?.toISOString()}`);
        
        // 내 순위 찾기
        const rankingData = data.data || [];
        const myRank = rankingData.find(entry => entry.userId === userId);
        
        if (myRank) {
          console.log(`내 순위: ${myRank.rank}위 (${myRank.score}점)`);
        } else {
          console.log('내 순위를 찾을 수 없습니다.');
        }
        
        break;
      } else {
        console.log(`❌ 문서 없음: ${docId}`);
      }
    }
    
    if (!leaderboardDoc) {
      console.log('모든 날짜에서 리더보드를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

testApiLogic();