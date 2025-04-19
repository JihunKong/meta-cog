'use client';

/// <reference types="@supabase/supabase-js" />

import { createBrowserClient } from '@supabase/ssr';

// 싱글톤 인스턴스를 저장할 변수들
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createBrowserClient> | null = null;

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 클라이언트 측에서 Supabase 인스턴스 생성
export function createSupabaseClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

// 일반 사용자용 클라이언트 (RLS가 적용됨) - 싱글톤 패턴
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};

// 기존 코드와의 호환성을 위한 직접 내보내기
export const supabase = getSupabaseClient();

// 서비스 작업 키는 클라이언트에서 사용하지 않음
// Admin 작업은 서버 컴포넌트에서만 createSupabaseAdminServerClient()를 통해 사용해야 함
