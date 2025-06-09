const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function deleteTestAccounts() {
  console.log('🗑️  테스트 계정 삭제 시작...', new Date().toISOString());

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
    const auth = admin.auth();

    // 삭제할 테스트 계정 이메일들
    const testEmails = [
      '2201@pof.com',
      '2106@pof.com', 
      'test@pof.com'
    ];

    console.log(`\n📋 삭제 대상 계정: ${testEmails.join(', ')}`);

    for (const email of testEmails) {
      console.log(`\n🔍 계정 처리 중: ${email}`);
      
      try {
        // 1. Firebase Auth에서 사용자 찾기
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(email);
          console.log(`  ✅ Auth 계정 발견: ${userRecord.uid}`);
        } catch (authError) {
          if (authError.code === 'auth/user-not-found') {
            console.log(`  ⚠️  Auth 계정 없음: ${email}`);
          } else {
            console.error(`  ❌ Auth 조회 오류:`, authError);
            continue;
          }
        }

        const userId = userRecord?.uid;

        // 2. Firestore에서 사용자 데이터 확인
        if (userId) {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log(`  📄 Firestore 사용자 데이터: ${userData.name} (${userData.role})`);
          }
        }

        // 3. 관련 데이터 삭제 (userId가 있는 경우)
        if (userId) {
          console.log(`  🗂️  관련 데이터 삭제 중...`);

          // 세션 데이터 삭제
          const sessionsQuery = await db.collection('sessions').where('user_id', '==', userId).get();
          console.log(`    - 세션 데이터: ${sessionsQuery.size}개`);
          const sessionDeletePromises = sessionsQuery.docs.map(doc => doc.ref.delete());

          // 목표 선언 삭제
          const goalsQuery = await db.collection('goalDeclarations').where('userId', '==', userId).get();
          console.log(`    - 목표 선언: ${goalsQuery.size}개`);
          const goalDeletePromises = goalsQuery.docs.map(doc => doc.ref.delete());

          // 목표 응원 삭제
          const supportsQuery = await db.collection('goalSupports').where('supporterId', '==', userId).get();
          console.log(`    - 목표 응원: ${supportsQuery.size}개`);
          const supportDeletePromises = supportsQuery.docs.map(doc => doc.ref.delete());

          // 목표 업데이트 삭제  
          const updatesQuery = await db.collection('goalUpdates').where('userId', '==', userId).get();
          console.log(`    - 목표 업데이트: ${updatesQuery.size}개`);
          const updateDeletePromises = updatesQuery.docs.map(doc => doc.ref.delete());

          // 사용자 통계 삭제
          const statsQuery = await db.collection('userGoalStats').where('userId', '==', userId).get();
          console.log(`    - 사용자 통계: ${statsQuery.size}개`);
          const statsDeletePromises = statsQuery.docs.map(doc => doc.ref.delete());

          // 모든 Firestore 데이터 삭제 실행
          await Promise.all([
            ...sessionDeletePromises,
            ...goalDeletePromises, 
            ...supportDeletePromises,
            ...updateDeletePromises,
            ...statsDeletePromises
          ]);

          // 사용자 문서 삭제
          try {
            await db.collection('users').doc(userId).delete();
            console.log(`    ✅ 사용자 문서 삭제 완료`);
          } catch (error) {
            console.log(`    ⚠️  사용자 문서 삭제 실패:`, error.message);
          }

          console.log(`    ✅ Firestore 데이터 삭제 완료`);
        }

        // 4. Firebase Auth 계정 삭제
        if (userRecord) {
          try {
            await auth.deleteUser(userId);
            console.log(`    ✅ Auth 계정 삭제 완료`);
          } catch (authError) {
            console.error(`    ❌ Auth 계정 삭제 실패:`, authError.message);
          }
        }

        console.log(`  🎉 ${email} 계정 삭제 완료`);

      } catch (error) {
        console.error(`  ❌ ${email} 처리 중 오류:`, error.message);
      }
    }

    console.log(`\n✨ 테스트 계정 삭제 작업 완료!`);

    // 남은 사용자 수 확인
    const remainingUsers = await db.collection('users').get();
    console.log(`📊 남은 사용자 수: ${remainingUsers.size}명`);
    
    if (remainingUsers.size > 0) {
      console.log('\n👥 남은 사용자들:');
      remainingUsers.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${data.name} (${data.email}) - ${data.role}`);
      });
    }

  } catch (error) {
    console.error('❌ 계정 삭제 중 오류:', error);
  }
}

// 확인 프롬프트
console.log('⚠️  주의: 이 스크립트는 테스트 계정과 관련된 모든 데이터를 영구적으로 삭제합니다.');
console.log('삭제 대상:');
console.log('- 2201@pof.com');
console.log('- 2106@pof.com'); 
console.log('- test@pof.com');
console.log('\n계속하려면 스크립트를 실행하세요...\n');

deleteTestAccounts();