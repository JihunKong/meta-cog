import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // 이 모듈을 찾을 수 없으므로 제거

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 오류를 던지지 않고 경고만 표시
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 누락되었습니다. 일부 기능이 작동하지 않을 수 있습니다.');
}

console.log("Supabase 설정:", {
  url: supabaseUrl ? '설정됨' : '누락됨',
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey
});

// 일반 타입 없이 클라이언트 생성
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// 서비스 롤 클라이언트 (관리자 권한)
if (!supabaseServiceKey) {
  console.warn("경고: SUPABASE_SERVICE_ROLE_KEY가 없습니다. 관리자 권한이 작동하지 않을 수 있습니다.");
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseServiceKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
); 