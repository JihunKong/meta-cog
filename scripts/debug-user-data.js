const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function debugUserData() {
  console.log('🔍 사용자 데이터 디버깅 시작...\n');

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

    // 특정 사용자 조회
    const userId = 'WyQ7hhZS18gGYbxiYV383eYw9Ua2';
    console.log('1️⃣ 특정 사용자 조회:', userId);
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('사용자 데이터:', JSON.stringify(userData, null, 2));
    } else {
      console.log('❌ 사용자를 찾을 수 없습니다.');
    }

    // 모든 사용자 조회 (학생만)
    console.log('\n2️⃣ 모든 학생 사용자 조회:');
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    console.log(`총 학생 수: ${studentsSnapshot.size}`);
    
    studentsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${doc.id} - ${data.name} (${data.school || '학교 정보 없음'})`);
    });

    // 세션 데이터 조회
    console.log('\n3️⃣ 사용자 세션 데이터 조회:');
    const sessionsSnapshot = await db.collection('sessions').where('user_id', '==', userId).limit(5).get();
    console.log(`사용자 세션 수: ${sessionsSnapshot.size}`);
    
    sessionsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.subject} - ${data.percent}% (${data.created_at?.toDate?.() || data.created_at})`);
    });

    console.log('\n✅ 디버깅 완료');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

debugUserData();