import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // 이 모듈을 찾을 수 없으므로 제거

// 환경 변수 로깅 (디버깅용)
const logEnvVars = () => {
  console.log('환경 변수 확인 (키 존재 여부만):', {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_DATABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
};

// 개발 환경에서만 로깅
if (process.env.NODE_ENV === 'development') {
  logEnvVars();
}

// Supabase URL 설정 (NEXT_PUBLIC_SUPABASE_URL이 우선)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ljrrinokzegzjbovssjy.supabase.co';
console.log('사용 중인 Supabase URL:', supabaseUrl);

// Anon Key 설정 (NEXT_PUBLIC_SUPABASE_ANON_KEY가 우선)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTg4MTQsImV4cCI6MjA1NzY5NDgxNH0.0Pfw3wLdvKperfxGpNTH1lytC_S1N8mK-xTmrRFBu-s';

// Service Role Key 설정
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjExODgxNCwiZXhwIjoyMDU3Njk0ODE0fQ.dT1-dsN3MUeigfKRaK97UBg_pV7Cx88rh_dnwxlHiLY';

// 개발 환경에서는 오류를 던지지 않고 경고만 표시
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 누락되었습니다. 일부 기능이 작동하지 않을 수 있습니다.');
  
  // 개발 환경에서 기본값 설정
  if (process.env.NODE_ENV === 'development') {
    console.log('개발 환경에서 기본 Supabase 설정을 사용합니다.');
  }
}

console.log("Supabase 설정:", {
  url: supabaseUrl ? '설정됨' : '누락됨',
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey
});

// 일반 타입 없이 클라이언트 생성
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// 서비스 롤 클라이언트 (관리자 권한)
if (!supabaseServiceKey) {
  console.warn("경고: SUPABASE_SERVICE_ROLE_KEY가 없습니다. 관리자 권한이 작동하지 않을 수 있습니다.");
  
  // 개발 환경에서 기본값 설정
  if (process.env.NODE_ENV === 'development') {
    console.log('개발 환경에서 기본 Supabase 서비스 롤 설정을 사용합니다.');
  }
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