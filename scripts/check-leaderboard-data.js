const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkLeaderboardData() {
  console.log('🔍 리더보드 집계 데이터 확인...\n');

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

    // 집계된 리더보드 데이터 확인
    console.log('📊 leaderboardAggregated 컬렉션 확인:');
    const aggregatedSnapshot = await db.collection('leaderboardAggregated').get();
    console.log(`총 집계 문서 수: ${aggregatedSnapshot.size}`);

    if (aggregatedSnapshot.size > 0) {
      console.log('\n📋 집계 문서 목록:');
      aggregatedSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${doc.id}`);
        console.log(`   - 기간: ${data.period}, 범위: ${data.scope}`);
        console.log(`   - 참가자 수: ${data.totalParticipants}`);
        console.log(`   - 마지막 업데이트: ${data.lastUpdated?.toDate?.() || data.lastUpdated}`);
        
        if (data.data && data.data.length > 0) {
          console.log(`   - 1위: ${data.data[0].name} (${data.data[0].score}점)`);
        }
        console.log('');
      });
    } else {
      console.log('❌ 집계 데이터가 없습니다.');
    }

    // 특정 사용자 테스트
    const testUserId = 'WyQ7hhZS18gGYbxiYV383eYw9Ua2';
    console.log(`\n🧪 사용자 ${testUserId}로 API 테스트:`);
    
    // 오늘 날짜로 문서 ID 생성
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const testDocIds = [
      `all_all_${todayStr}`,
      `weekly_all_${todayStr}`,
      `monthly_all_${todayStr}`,
      `all_완도고등학교_${todayStr}`
    ];

    for (const docId of testDocIds) {
      console.log(`\n📄 문서 ${docId} 확인:`);
      const doc = await db.collection('leaderboardAggregated').doc(docId).get();
      
      if (doc.exists) {
        const data = doc.data();
        console.log(`✅ 존재 - 참가자 ${data.totalParticipants}명`);
        
        // 해당 사용자가 포함되어 있는지 확인
        const userEntry = data.data?.find(entry => entry.userId === testUserId);
        if (userEntry) {
          console.log(`👤 사용자 순위: ${userEntry.rank}위 (${userEntry.score}점)`);
        } else {
          console.log('❌ 사용자를 찾을 수 없음');
        }
      } else {
        console.log('❌ 문서 없음');
      }
    }

    // 최근 집계 문서 확인
    console.log('\n📅 가장 최근 집계 문서들:');
    const recentDocs = await db.collection('leaderboardAggregated')
      .orderBy('lastUpdated', 'desc')
      .limit(5)
      .get();

    recentDocs.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${doc.id} (${data.totalParticipants}명)`);
    });

    console.log('\n✅ 리더보드 데이터 확인 완료');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkLeaderboardData();