/**
 * Firebase Authentication 테스트 사용자 생성 스크립트
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 서비스 계정 키 파일 경로
const serviceAccountPath = path.join(process.cwd(), 'config', 'firebase-service-account.json');

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  try {
    if (fs.existsSync(serviceAccountPath)) {
      // 서비스 계정 키 파일 사용
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
      
      console.log('Firebase Admin SDK 초기화 성공 (서비스 계정 키 파일 사용)');
    } else {
      console.error('서비스 계정 키 파일을 찾을 수 없습니다:', serviceAccountPath);
      process.exit(1);
    }
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 오류:', error);
    process.exit(1);
  }
}

// 테스트 사용자 정보
const testUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    displayName: '관리자'
  },
  {
    email: 'teacher@example.com',
    password: 'teacher123',
    role: 'teacher',
    displayName: '선생님'
  },
  {
    email: 'student@example.com',
    password: 'student123',
    role: 'student',
    displayName: '홍길동'
  }
];

/**
 * Firebase Authentication에 사용자 생성 및 Firestore에 역할 정보 업데이트
 */
async function createTestUsers() {
  const auth = admin.auth();
  const db = admin.firestore();
  
  for (const user of testUsers) {
    try {
      // 기존 사용자 확인
      try {
        const userRecord = await auth.getUserByEmail(user.email);
        console.log(`사용자가 이미 존재합니다: ${user.email} (${userRecord.uid})`);
        
        // 프로필 업데이트
        await db.collection('profiles').doc(userRecord.uid).set({
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { merge: true });
        
        continue;
      } catch (error) {
        // 사용자가 없는 경우 새로 생성
        if (error.code === 'auth/user-not-found') {
          console.log(`새 사용자 생성: ${user.email}`);
        } else {
          throw error;
        }
      }
      
      // 새 사용자 생성
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true
      });
      
      console.log(`사용자 생성 완료: ${user.email} (${userRecord.uid})`);
      
      // Firestore에 사용자 프로필 저장/업데이트
      await db.collection('profiles').doc(userRecord.uid).set({
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // 학생인 경우 student_names 컬렉션에도 추가
      if (user.role === 'student') {
        await db.collection('student_names').add({
          user_id: userRecord.uid,
          display_name: user.displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      console.log(`사용자 프로필 저장 완료: ${user.email}`);
    } catch (error) {
      console.error(`사용자 생성 오류 (${user.email}):`, error);
    }
  }
  
  console.log('테스트 사용자 생성 완료!');
}

// 실행
createTestUsers()
  .then(() => {
    console.log('모든 작업이 완료되었습니다.');
    process.exit(0);
  })
  .catch(error => {
    console.error('오류 발생:', error);
    process.exit(1);
  });
