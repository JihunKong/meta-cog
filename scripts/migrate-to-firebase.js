/**
 * Supabase에서 Firebase로 데이터 마이그레이션 스크립트
 * 
 * 이 스크립트는 다음 데이터를 마이그레이션합니다:
 * 1. 사용자 프로필 (profiles 테이블)
 * 2. 학생 이름 (student_names 테이블)
 * 
 * 사용 방법:
 * 1. .env.local 파일에 Supabase와 Firebase 인증 정보가 설정되어 있는지 확인
 * 2. 터미널에서 다음 명령 실행: node scripts/migrate-to-firebase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase 연결 정보가 없습니다. .env.local 파일을 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Firebase Admin SDK 초기화
let db = null;
let auth = null;
global.testMode = false;

if (!admin.apps.length) {
  try {
    // 환경 변수에서 Firebase 인증 정보 확인
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!projectId || !clientEmail || !privateKey || privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
      console.log('Firebase 인증 정보가 올바르게 설정되지 않았습니다.');
      console.log('테스트 모드로 실행합니다. 실제 데이터는 마이그레이션되지 않습니다.');
      
      // 테스트 모드 - 실제 Firebase 연결 없이 진행
      global.testMode = true;
    } else {
      // 실제 Firebase 연결
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n')
        })
      });
      db = admin.firestore();
      auth = admin.auth();
      global.testMode = false;
    }
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 오류:', error);
    console.log('테스트 모드로 실행합니다. 실제 데이터는 마이그레이션되지 않습니다.');
    global.testMode = true;
  }
}

// db와 auth는 위에서 초기화했으므로 여기서는 삭제

/**
 * 프로필 데이터 마이그레이션
 */
async function migrateProfiles() {
  console.log('프로필 마이그레이션 시작...');
  
  try {
    // Supabase에서 모든 프로필 가져오기
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`${profiles.length}개의 프로필을 찾았습니다.`);
    
    // 테스트 모드인 경우 실제 데이터 마이그레이션 건너뛰기
    if (global.testMode) {
      console.log('테스트 모드: 프로필 데이터는 실제로 마이그레이션되지 않습니다.');
      console.log('마이그레이션될 데이터 샘플:');
      console.log(profiles.slice(0, 2));
      return;
    }
    
    // Firebase Firestore에 프로필 저장
    let batch = db.batch();
    let count = 0;
    
    for (const profile of profiles) {
      const profileRef = db.collection('profiles').doc(profile.user_id);
      
      batch.set(profileRef, {
        email: profile.email,
        role: profile.role || 'student',
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      count++;
      
      // Firestore는 한 번에 최대 500개의 작업만 허용
      if (count % 450 === 0) {
        await batch.commit();
        console.log(`${count}개의 프로필 처리 완료`);
        batch = db.batch();
      }
    }
    
    // 남은 프로필 저장
    if (count % 450 !== 0) {
      await batch.commit();
    }
    
    console.log(`프로필 마이그레이션 완료: ${count}개 처리됨`);
  } catch (error) {
    console.error('프로필 마이그레이션 오류:', error);
  }
}

/**
 * 학생 이름 데이터 마이그레이션
 */
async function migrateStudentNames() {
  console.log('학생 이름 마이그레이션 시작...');
  
  try {
    // Supabase에서 모든 학생 이름 가져오기
    const { data: studentNames, error } = await supabase
      .from('student_names')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`${studentNames.length}개의 학생 이름을 찾았습니다.`);
    
    // 테스트 모드인 경우 실제 데이터 마이그레이션 건너뛰기
    if (global.testMode) {
      console.log('테스트 모드: 학생 이름 데이터는 실제로 마이그레이션되지 않습니다.');
      console.log('마이그레이션될 데이터 샘플:');
      console.log(studentNames.slice(0, 2));
      return;
    }
    
    // Firebase Firestore에 학생 이름 저장
    let batch = db.batch();
    let count = 0;
    
    for (const student of studentNames) {
      const studentRef = db.collection('student_names').doc();
      
      batch.set(studentRef, {
        user_id: student.user_id,
        display_name: student.display_name,
        created_at: student.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      count++;
      
      // Firestore는 한 번에 최대 500개의 작업만 허용
      if (count % 450 === 0) {
        await batch.commit();
        console.log(`${count}개의 학생 이름 처리 완료`);
        batch = db.batch();
      }
    }
    
    // 남은 학생 이름 저장
    if (count % 450 !== 0) {
      await batch.commit();
    }
    
    console.log(`학생 이름 마이그레이션 완료: ${count}개 처리됨`);
  } catch (error) {
    console.error('학생 이름 마이그레이션 오류:', error);
  }
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateData() {
  console.log('Supabase에서 Firebase로 데이터 마이그레이션 시작');
  
  try {
    // 프로필 마이그레이션
    await migrateProfiles();
    
    // 학생 이름 마이그레이션
    await migrateStudentNames();
    
    console.log('데이터 마이그레이션이 완료되었습니다!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 마이그레이션 실행
migrateData();
