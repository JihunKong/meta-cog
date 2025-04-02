import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // 이 모듈을 찾을 수 없으므로 제거

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log("Supabase 설정:", {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey
});

// 일반 타입 없이 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서비스 롤 클라이언트 (관리자 권한)
if (!supabaseServiceKey) {
  console.warn("경고: SUPABASE_SERVICE_ROLE_KEY가 없습니다. 관리자 권한이 작동하지 않을 수 있습니다.");
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || '', // 빈 문자열 대신 더 명확한 오류 처리가 필요할 수 있음
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
); 