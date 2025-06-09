const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testLeaderboardAPI() {
  console.log('🧪 리더보드 API 직접 테스트...\n');

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
    const testUserId = 'WyQ7hhZS18gGYbxiYV383eYw9Ua2';

    // 사용자 정보 확인
    console.log('👤 테스트 사용자 정보:');
    const userDoc = await db.collection('users').doc(testUserId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`이름: ${userData.name}, 학교: ${userData.school}`);
    } else {
      console.log('❌ 사용자를 찾을 수 없음');
      return;
    }

    // 각 기간별 테스트
    const periods = [
      { id: 0, name: '전체', periodName: 'all', scope: 'all' },
      { id: 1, name: '이번 주', periodName: 'weekly', scope: 'all' },
      { id: 2, name: '이번 달', periodName: 'monthly', scope: 'all' },
      { id: 3, name: '내 학교', periodName: 'all', scope: '완도고등학교' }
    ];

    for (const period of periods) {
      console.log(`\n📊 ${period.name} 리더보드 테스트:`);
      
      // 집계 데이터 확인
      const aggregatedSnapshot = await db.collection('leaderboardAggregated')
        .where('period', '==', period.periodName)
        .where('scope', '==', period.scope)
        .orderBy('lastUpdated', 'desc')
        .limit(1)
        .get();

      if (!aggregatedSnapshot.empty) {
        const doc = aggregatedSnapshot.docs[0];
        const data = doc.data();
        console.log(`✅ 집계 데이터 발견: ${doc.id}`);
        console.log(`   참가자 수: ${data.totalParticipants}`);
        
        // 해당 사용자 순위 확인
        const userEntry = data.data?.find(entry => entry.userId === testUserId);
        if (userEntry) {
          console.log(`   사용자 순위: ${userEntry.rank}위 (${userEntry.score}점)`);
        } else {
          console.log('   ❌ 사용자 데이터 없음');
        }
      } else {
        console.log('❌ 집계 데이터 없음');
      }
    }

    // API 로직 시뮬레이션 테스트
    console.log('\n🔄 API 로직 시뮬레이션:');
    
    const currentUser = userDoc.data();
    const period = 0; // 전체
    const periodMap = { 0: 'all', 1: 'weekly', 2: 'monthly', 3: 'all' };
    const periodName = periodMap[period];
    
    let scope = 'all';
    if (period === 3 && currentUser?.school) {
      scope = currentUser.school;
    }

    console.log(`기간: ${periodName}, 범위: ${scope}`);

    const recentSnapshot = await db.collection('leaderboardAggregated')
      .where('period', '==', periodName)
      .where('scope', '==', scope)
      .orderBy('lastUpdated', 'desc')
      .limit(1)
      .get();

    if (!recentSnapshot.empty) {
      const aggregatedDoc = recentSnapshot.docs[0];
      const aggregatedData = aggregatedDoc.data();
      const leaderboardData = aggregatedData?.data || [];
      
      console.log(`✅ API 성공 시뮬레이션:`);
      console.log(`   문서: ${aggregatedDoc.id}`);
      console.log(`   데이터 개수: ${leaderboardData.length}`);
      
      if (leaderboardData.length > 0) {
        console.log(`   1위: ${leaderboardData[0].name} (${leaderboardData[0].score}점)`);
        
        const myRank = leaderboardData.find(entry => entry.userId === testUserId);
        if (myRank) {
          console.log(`   내 순위: ${myRank.rank}위 (${myRank.score}점)`);
        }
      }
    } else {
      console.log('❌ API 실패 시뮬레이션: 집계 데이터 없음');
    }

    console.log('\n✅ 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  }
}

testLeaderboardAPI();