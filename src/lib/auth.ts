'use client';

import { getFirebaseInstance } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as firebaseSignIn, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

// 사용자 타입 정의
interface User {
  id: string;
  email?: string;
  role?: string;
}

// 사용자 역할 정의
export type UserRole = 'student' | 'teacher' | 'admin';

// 추가 학생 정보 타입 정의
interface StudentInfo {
  name: string;
  school: string;
  grade: string;
  classNum: string;
  studentNum: string;
}

// 로그인 함수
export async function signInWithEmail(email: string, password: string) {
  console.log('로그인 시도:', email);
  
  try {
    const { auth } = getFirebaseInstance();
    // 인증 시도
    const userCredential = await firebaseSignIn(auth, email, password);
    
    if (userCredential.user) {
      console.log('로그인 성공:', userCredential.user.uid);
      return { 
        data: { 
          user: {
            id: userCredential.user.uid,
            email: userCredential.user.email,
          },
          session: userCredential
        }, 
        error: null 
      };
    }
    
    return { data: null, error: null };
  } catch (error: any) {
    console.error('로그인 오류:', error);
    return { 
      data: null, 
      error: { 
        message: error.message || '로그인 중 오류가 발생했습니다.' 
      } 
    };
  }
}

// 새 계정 생성 함수 수정 (학생 정보 인자 추가) - API 호출 방식으로 변경
export async function signUpWithEmail(email: string, password: string, studentInfo: StudentInfo) {
  try {
    const { auth } = getFirebaseInstance();
    const safeRole = 'student'; // 역할은 항상 student로 고정
    
    // 서버 API를 통한 회원가입 처리
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        studentInfo
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '회원가입 중 오류가 발생했습니다.');
    }
    
    // 회원가입 성공 후 자동 로그인 시도
    try {
      await signInWithEmail(email, password);
    } catch (loginError) {
      console.warn('회원가입 후 자동 로그인 실패:', loginError);
      // 로그인 실패는 회원가입 성공에 영향을 주지 않음
    }

    return { 
      data: { 
        user: result.user
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error('회원가입 오류:', error);
    return { 
      data: null, 
      error: { 
        message: error.message || '회원가입 중 오류가 발생했습니다.' 
      } 
    };
  }
}

// 사용자 권한 확인 함수 (API 연동)
export async function getUserRole(): Promise<string | null> {
  try {
    const { auth } = getFirebaseInstance();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('로그인된 사용자 없음');
      return null;
    }
    
    // 1. ID 토큰에서 admin 클레임 확인
    try {
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.admin === true) {
        console.log('ID 토큰에서 admin 클레임 확인됨');
        return 'admin'; // 클레임이 있으면 바로 admin 반환
      }
    } catch (tokenError) {
      console.error('ID 토큰 확인 중 오류 발생:', tokenError);
      // 토큰 오류가 발생해도 일단 계속 진행 (API 확인 시도)
    }

    // 2. 서버 API를 통한 역할 안전 조회
    try {
      console.log('API를 통한 역할 조회 시도...');
      const res = await fetch(`/api/get-role?user_id=${user.uid}`);
      if (res.ok) {
        const result = await res.json();
        if (result.role) {
          console.log('API에서 역할 찾음:', result.role);
          return normalizeRole(result.role);
        }
      } else { // API 호출 실패 또는 역할 없음
         console.warn(`API 역할 조회 실패: ${res.status} ${res.statusText}`);
      }
    } catch (apiError) {
      console.error('역할 조회 API 오류:', apiError);
    }
    
    console.log('역할을 찾을 수 없음 (API 조회 후)');
    return null;
  } catch (error) {
    console.error('getUserRole 오류:', error);
    return null;
  }
}

// 역할을 정규화하는 함수
function normalizeRole(role: string | undefined | null): string | null {
  if (!role) return null;
  const normalizedRole = role.toLowerCase().trim();
  // 유효한 역할만 허용
  if (["teacher", "student", "admin"].includes(normalizedRole)) {
    return normalizedRole;
  }
  // 유효하지 않은 역할: 경고 로그 남기지 않음
  return null;
}

// 사용자 표시 이름 가져오기 함수 수정 (API 호출 방식으로 변경)
export async function getUserName(): Promise<string | null> {
  try {
    const { auth } = getFirebaseInstance();
    const user = auth.currentUser;
    if (!user) return null;

    // API를 통한 사용자 이름 조회
    try {
      const response = await fetch(`/api/auth/get-user-name?user_id=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
          return data.name;
        }
      }
    } catch (apiError) {
      console.warn('사용자 이름 API 조회 실패:', apiError);
      // API 오류가 발생해도 계속 진행
    }
    
    // 백업: Auth 객체의 displayName 사용 (updateProfile 성공 시)
    if (user.displayName) {
        return user.displayName;
    }

    // 최후의 수단: 이메일 사용
    return user.email || user.uid;

  } catch (error) {
    console.error("사용자 이름 조회 오류:", error);
    return null;
  }
}

// 로그아웃 함수
export async function signOut() {
  const { auth } = getFirebaseInstance();
  await firebaseSignOut(auth);
}