'use client';

import { getSupabaseClient } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// 사용자 타입 정의
interface User {
  id: string;
  email?: string;
}

// 사용자 역할 정의
export type UserRole = 'student' | 'teacher' | 'admin';

// 로그인 함수
export async function signInWithEmail(email: string, password: string) {
  console.log('로그인 시도:', email);
  
  try {
    const supabase = getSupabaseClient();
    // 인증 시도
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('로그인 오류:', error);
      return { data, error };
    }
    
    if (data?.user) {
      console.log('로그인 성공:', data.user.id);
    }
    
    return { data, error };
  } catch (unexpectedError) {
    console.error('로그인 중 예상치 못한 오류:', unexpectedError);
    return { data: null, error: { message: '예상치 못한 오류가 발생했습니다.' } as any };
  }
}

// 새 계정 생성 함수 (클라이언트에서 처리)
export async function signUpWithEmail(email: string, password: string, role: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password, 
    options: { 
      data: { role } 
    } 
  });
  
  return { data, error };
}

// 사용자 권한 확인 함수 (클라이언트에서 처리)
export async function getUserRole(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    
    if (!user) {
      console.log('로그인된 사용자 없음');
      return null;
    }
    
    console.log(`사용자 정보 확인: ${user.id}, 이메일: ${user.email}`);
    
    // 1. 먼저 user_metadata에서 역할 확인
    if (user.user_metadata && user.user_metadata.role) {
      const metaRole = normalizeRole(user.user_metadata.role);
      console.log(`메타데이터에서 역할 찾음: ${metaRole}`);
      
      // 메타데이터에서 유효한 역할을 찾았으면 반환
      if (metaRole) {
        return metaRole;
      }
    }
    
    // 2. 메타데이터에 역할이 없으면 profiles 테이블에서 확인
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('프로필 조회 오류:', error.message);
      return 'student'; // 기본값
    }
    
    if (profile && profile.role) {
      console.log(`프로필 테이블에서 역할 찾음: ${profile.role}`);
      return normalizeRole(profile.role);
    }
    
    // 3. 프로필이 없거나 역할이 없는 경우 기본값 반환
    console.log('역할을 찾을 수 없어 기본값 student 사용');
    return 'student';
  } catch (error) {
    console.error('역할 확인 중 예외 발생:', error);
    return 'student'; // 오류 발생 시 기본값
  }
}

// 역할을 정규화하는 함수
function normalizeRole(role: string | undefined | null): string | null {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // 유효한 역할만 허용
  if (['teacher', 'student', 'admin'].includes(normalizedRole)) {
    return normalizedRole;
  }
  
  console.warn(`유효하지 않은 역할: ${role}, 원본: ${role}`);
  return null;
}

// 사용자 표시 이름 가져오기 함수 (클라이언트에서 실행)
export async function getUserName(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // 이메일을 기본 이름으로 사용
    const defaultName = user.email || user.id;
    
    // student_names 테이블에서 이름 조회 시도
    const { data: studentData, error: studentError } = await supabase
      .from('student_names')
      .select('display_name')
      .eq('user_id', user.id)
      .single();
    
    // 학생 정보가 없는 경우 기본 이름 반환
    if (studentError || !studentData) {
      console.log('학생 이름 조회 오류 또는 데이터 없음:', studentError ? studentError.message : '데이터 없음');
      return defaultName;
    }
    
    // 표시 이름 반환 (없으면 기본 이름)
    const displayName = studentData.display_name;
    return displayName ? String(displayName) : defaultName;
  } catch (error) {
    console.error("사용자 이름 조회 오류:", error);
    return null;
  }
}

// 로그아웃 함수
export async function signOut() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}