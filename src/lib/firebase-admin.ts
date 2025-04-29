import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// 서비스 계정 키 파일 경로
const serviceAccountPath = path.join(process.cwd(), 'config', 'firebase-service-account.json');

// Firebase Admin SDK 싱글톤 관리
interface FirebaseAdminApp {
  admin: typeof admin;
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
}

// 싱글톤 인스턴스
let firebaseAdminApp: FirebaseAdminApp | null = null;

/**
 * Firebase Admin SDK 초기화 및 싱글톤 인스턴스 반환
 */
function getFirebaseAdminApp(): FirebaseAdminApp {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  // 이미 초기화된 앱이 있는지 확인
  if (admin.apps.length > 0) {
    const app = admin.app();
    firebaseAdminApp = {
      admin,
      db: admin.firestore(app),
      auth: admin.auth(app),
    };
    return firebaseAdminApp;
  }

  // 새로 초기화 필요
  try {
    let app;
    
    // 서비스 계정 키 파일 사용
    if (fs.existsSync(serviceAccountPath)) {
      // 서비스 계정 키 파일을 직접 읽어서 파싱
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
      
      console.log('Firebase Admin SDK 초기화 성공 (서비스 계정 키 파일 사용)');
    } else {
      // 환경 변수 사용 (클라우드 환경용)
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'meta-cog-7d9d3',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'meta-cog-7d9d3'}.firebaseio.com`,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'meta-cog-7d9d3'}.appspot.com`
      });
      
      console.log('Firebase Admin SDK 초기화 성공 (환경 변수 사용)');
    }
    
    // 싱글톤 객체 생성
    firebaseAdminApp = {
      admin,
      db: admin.firestore(app),
      auth: admin.auth(app),
    };
    
    return firebaseAdminApp;
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 오류:', error);
    throw error; // 오류를 상위로 전파하여 실패를 명확히 표시
  }
}

// Firebase Admin 전체 인스턴스 가져오기
export function getFirebaseAdminInstance() {
  return getFirebaseAdminApp().admin;
}

// Firebase Admin Firestore 인스턴스 가져오기
export function getFirebaseAdminFirestore() {
  return getFirebaseAdminApp().db;
}

// Firebase Admin Auth 인스턴스 가져오기
export function getFirebaseAdminAuth() {
  return getFirebaseAdminApp().auth;
}
