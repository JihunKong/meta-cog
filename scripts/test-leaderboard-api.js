const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testLeaderboardAPI() {
  console.log('🧪 리더보드 API 테스트 시작...\n');

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

    console.log('1️⃣ 전체 리더보드 (period 0) 시뮬레이션:');
    await testPeriod(db, 0, 'WyQ7hhZS18gGYbxiYV383eYw9Ua2');
    
    console.log('\n2️⃣ 학교 리더보드 (period 3) 시뮬레이션:');
    await testPeriod(db, 3, 'WyQ7hhZS18gGYbxiYV383eYw9Ua2');

    console.log('\n✅ API 테스트 완료');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

async function testPeriod(db, period, userId) {
  try {
    // 사용자 데이터 조회
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    console.log(`현재 사용자: ${userData.name} (${userData.school})`);

    // 세션 쿼리 (리더보드 API와 동일한 로직)
    let sessionsQuery = db.collection('sessions');
    
    if (period === 3) { // 내 학교
      if (userData?.school) {
        console.log(`학교 필터 적용: ${userData.school}`);
        // 학교 기준으로 필터링을 위해 사용자들을 먼저 조회
        const schoolUsersSnapshot = await db.collection('users')
          .where('school', '==', userData.school)
          .get();
        
        const schoolUserIds = schoolUsersSnapshot.docs.map(doc => doc.id);
        console.log(`같은 학교 사용자 수: ${schoolUserIds.length}`);
        
        if (schoolUserIds.length > 0) {
          // Firebase의 'in' 쿼리는 최대 10개 제한이 있음
          const batchSize = 10;
          let allSessions = [];
          
          for (let i = 0; i < schoolUserIds.length; i += batchSize) {
            const batch = schoolUserIds.slice(i, i + batchSize);
            const batchSnapshot = await db.collection('sessions')
              .where('user_id', 'in', batch)
              .get();
            allSessions.push(...batchSnapshot.docs);
          }
          
          console.log(`학교 내 총 세션 수: ${allSessions.length}`);
        }
      }
    } else {
      // 전체 세션 조회
      const allSessionsSnapshot = await sessionsQuery.get();
      console.log(`전체 세션 수: ${allSessionsSnapshot.size}`);
    }

    console.log('✅ 쿼리 테스트 성공');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  }
}

testLeaderboardAPI();