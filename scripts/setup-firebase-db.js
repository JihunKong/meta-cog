/**
 * Firebase 데이터베이스 초기 설정 스크립트
 * 
 * 이 스크립트는 Firebase Firestore에 기본 컬렉션과 문서를 생성합니다.
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

const db = admin.firestore();

/**
 * 기본 사용자 프로필 생성
 */
async function createDefaultProfiles() {
  console.log('기본 사용자 프로필 생성 시작...');
  
  try {
    // 관리자 프로필
    await db.collection('profiles').doc('admin').set({
      email: 'admin@example.com',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // 교사 프로필
    await db.collection('profiles').doc('teacher').set({
      email: 'teacher@example.com',
      role: 'teacher',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // 학생 프로필
    await db.collection('profiles').doc('student').set({
      email: 'student@example.com',
      role: 'student',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('기본 사용자 프로필 생성 완료');
  } catch (error) {
    console.error('프로필 생성 오류:', error);
  }
}

/**
 * 기본 학생 이름 생성
 */
async function createDefaultStudentNames() {
  console.log('기본 학생 이름 생성 시작...');
  
  try {
    await db.collection('student_names').add({
      user_id: 'student',
      display_name: '홍길동',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('기본 학생 이름 생성 완료');
  } catch (error) {
    console.error('학생 이름 생성 오류:', error);
  }
}

/**
 * 메인 설정 함수
 */
async function setupFirebaseDb() {
  console.log('Firebase 데이터베이스 초기 설정 시작');
  
  try {
    // 기본 사용자 프로필 생성
    await createDefaultProfiles();
    
    // 기본 학생 이름 생성
    await createDefaultStudentNames();
    
    console.log('Firebase 데이터베이스 초기 설정 완료!');
  } catch (error) {
    console.error('데이터베이스 설정 중 오류 발생:', error);
  }
}

// 설정 실행
setupFirebaseDb();
