/// <reference types="@supabase/supabase-js" />

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 싱글톤 인스턴스를 저장할 변수들
let supabaseInstance: ReturnType<typeof createServerClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createServerClient> | null = null;

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// 일반 사용자용 클라이언트 (RLS가 적용됨) - 싱글톤 패턴
export const getSupabaseClient = () => {
  const cookieStore = cookies();
  
  if (!supabaseInstance) {
    supabaseInstance = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name, options) => {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    });
  }
  return supabaseInstance;
};

// 관리자용 클라이언트 (서버에서만 유효) - 싱글톤 패턴
export const getSupabaseAdminClient = () => {
  const cookieStore = cookies();
  
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name, options) => {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    });
  }
  return supabaseAdminInstance;
};

// 기존 코드와의 호환성을 위한 직접 내보내기
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();
