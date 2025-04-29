'use client';

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase 앱 초기화
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseDb: Firestore | undefined;
let firebaseAnalytics: Analytics | undefined;

// Firebase 인스턴스 초기화 함수
function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    
    // Analytics는 브라우저 환경에서만 초기화
    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported && firebaseApp) {
          firebaseAnalytics = getAnalytics(firebaseApp);
        }
      });
    }
  }
  
  return {
    app: firebaseApp as FirebaseApp,
    auth: firebaseAuth as Auth,
    db: firebaseDb as Firestore,
    analytics: firebaseAnalytics
  };
}

// Firebase 인스턴스 가져오기
export function getFirebaseInstance() {
  return initializeFirebase();
}

// 기본 내보내기
export const firebase = getFirebaseInstance();
