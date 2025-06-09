const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkGoalData() {
  console.log('🎯 목표 데이터 확인 시작...');

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

    // 목표 선언 컬렉션 확인
    console.log('\n📋 goalDeclarations 컬렉션 확인...');
    const goalsSnapshot = await db.collection('goalDeclarations').get();
    console.log(`총 목표 문서 수: ${goalsSnapshot.size}`);

    if (goalsSnapshot.size > 0) {
      console.log('\n📝 목표 목록:');
      goalsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${doc.id}`);
        console.log(`   제목: ${data.title}`);
        console.log(`   작성자 ID: ${data.userId}`);
        console.log(`   과목: ${data.subject}`);
        console.log(`   상태: ${data.status}`);
        console.log(`   공개 여부: ${data.isPublic}`);
        console.log(`   선언일: ${data.declaredAt?.toDate?.()?.toISOString() || data.declaredAt}`);
        console.log('');
      });
    } else {
      console.log('저장된 목표가 없습니다.');
    }

    // 특정 사용자의 목표 확인
    const testUserId = 'WyQ7hhZS18gGYbxiYV383eYw9Ua2';
    console.log(`\n👤 사용자 ${testUserId}의 목표 확인...`);
    
    const userGoalsSnapshot = await db.collection('goalDeclarations')
      .where('userId', '==', testUserId)
      .get();
    
    console.log(`해당 사용자의 목표 수: ${userGoalsSnapshot.size}`);

    if (userGoalsSnapshot.size > 0) {
      userGoalsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.title} (${data.status})`);
      });
    }

    // 공개 목표 확인
    console.log('\n🌍 공개 목표 확인...');
    const publicGoalsSnapshot = await db.collection('goalDeclarations')
      .where('isPublic', '==', true)
      .get();
    
    console.log(`공개 목표 수: ${publicGoalsSnapshot.size}`);

    // 사용자 정보 확인
    console.log('\n👥 사용자 정보 확인...');
    const userDoc = await db.collection('users').doc(testUserId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`사용자 이름: ${userData.name}`);
      console.log(`학교: ${userData.school}`);
    } else {
      console.log('해당 사용자를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkGoalData();