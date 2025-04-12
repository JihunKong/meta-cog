import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // 이 모듈을 찾을 수 없으므로 제거

// Netlify 환경 변수를 사용하여 Supabase 설정 로드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 환경 변수가 설정되지 않은 경우 경고 표시
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 누락되었습니다. Netlify 환경 변수 설정을 확인하세요.');
}

console.log("Supabase 설정:", {
  url: supabaseUrl ? '설정됨' : '누락됨',
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey
});

// 일반 클라이언트 생성 (더 이상 하드코딩된 값 사용 안함)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 서비스 롤 클라이언트 (관리자 권한)
if (!supabaseServiceKey) {
  console.warn("경고: SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. Netlify 환경 변수를 확인하세요.");
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// 클라이언트 측에서 supabase 객체를 사용하기 전에 항상 null 체크를 수행해야 함
export const checkSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
  }
  return supabase;
};

// 관리자 클라이언트 확인
export const checkSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase 관리자 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
  }
  return supabaseAdmin;
}; 