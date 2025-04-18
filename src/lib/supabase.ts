/// <reference types="@supabase/supabase-js" />

import { createClient } from '@supabase/supabase-js';

// 싱글톤 인스턴스를 저장할 변수들
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// 일반 사용자용 클라이언트 (RLS가 적용됨) - 싱글톤 패턴
export const supabase = getSupabaseClient();

// 관리자용 클라이언트 (서버에서만 유효) - 싱글톤 패턴
export const supabaseAdmin = getSupabaseAdminClient();

// 싱글톤 패턴으로 Supabase 클라이언트 인스턴스 반환
function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// 싱글톤 패턴으로 Supabase 관리자 클라이언트 인스턴스 반환
function getSupabaseAdminClient() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminInstance;
}
