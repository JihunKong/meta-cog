const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testLeaderboardDocs() {
  console.log('🔍 리더보드 문서 확인 시작...');

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

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];
    console.log('오늘 날짜:', today);

    // 예상되는 문서 ID들
    const expectedDocs = [
      `all_all_${today}`,
      `weekly_all_${today}`,
      `monthly_all_${today}`,
      `all_완도고등학교_${today}`,
      `weekly_완도고등학교_${today}`,
      `monthly_완도고등학교_${today}`
    ];

    console.log('\n📋 리더보드 컬렉션의 모든 문서 조회...');
    const allDocs = await db.collection('leaderboard').get();
    console.log(`총 문서 수: ${allDocs.size}`);

    allDocs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.totalParticipants || 0}명, 생성일: ${data.generatedAt?.toDate?.()?.toISOString() || data.generatedAt}`);
    });

    console.log('\n🎯 예상 문서 ID 확인...');
    for (const docId of expectedDocs) {
      const doc = await db.collection('leaderboard').doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        console.log(`✅ ${docId}: ${data.totalParticipants || 0}명 참여`);
      } else {
        console.log(`❌ ${docId}: 문서 없음`);
      }
    }

    // 테스트 사용자 정보 확인
    console.log('\n👤 테스트 사용자 확인...');
    const testUserId = 'WyQ7hhZS18gGYbxiYV383eYw9Ua2';
    const userDoc = await db.collection('users').doc(testUserId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`사용자 정보: ${userData.name} (${userData.school})`);
    } else {
      console.log('테스트 사용자를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

testLeaderboardDocs();