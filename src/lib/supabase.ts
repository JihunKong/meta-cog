import { createClient } from '@supabase/supabase-js';

// 디버깅을 위한 환경 변수 출력
console.log('환경 변수 디버깅:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락됨');
console.log('NEXT_PUBLIC_SUPABASE_DATABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL ? '설정됨' : '누락됨');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '누락됨');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '누락됨');

// 수파베이스 URL 설정 (다중 소스 지원)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL ||
                    'https://ljrrinokzegzjbovssjy.supabase.co';

// 익명 키 설정
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTg4MTQsImV4cCI6MjA1NzY5NDgxNH0.0Pfw3wLdvKperfxGpNTH1lytC_S1N8mK-xTmrRFBu-s';

// 서비스 롤 키 설정 (하드코딩된 키 포함, 개발용)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjExODgxNCwiZXhwIjoyMDU3Njk0ODE0fQ.dT1-dsN3MUeigfKRaK97UBg_pV7Cx88rh_dnwxlHiLY';

// 클라이언트 생성 설정
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

// 익명 클라이언트 생성 (RLS 적용됨)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// 관리자 클라이언트 생성 (RLS 우회)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, options);

// 디버깅을 위한 정보 출력
console.log('Supabase 클라이언트 설정:');
console.log('Supabase URL:', supabaseUrl.substring(0, 20) + '...');
console.log('Anon Key의 유효성:', supabaseAnonKey.length > 20 ? '정상' : '비정상');
console.log('Service Role Key의 유효성:', serviceRoleKey.length > 20 ? '정상' : '비정상');
console.log('Admin 클라이언트 생성됨:', !!supabaseAdmin);

// 테스트 함수: Supabase가 올바르게 작동하는지 확인
export async function testSupabaseConnection() {
  try {
    // 익명 클라이언트 테스트
    const { data: anonData, error: anonError } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    console.log('익명 클라이언트 테스트:', anonError ? '실패' : '성공');
    if (anonError) console.error('익명 클라이언트 오류:', anonError);
    
    // 관리자 클라이언트 테스트
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    console.log('관리자 클라이언트 테스트:', adminError ? '실패' : '성공');
    if (adminError) console.error('관리자 클라이언트 오류:', adminError);
    
    return {
      anonSuccess: !anonError,
      adminSuccess: !adminError
    };
  } catch (e) {
    console.error('Supabase 연결 테스트 중 예외 발생:', e);
    return {
      anonSuccess: false,
      adminSuccess: false,
      error: e
    };
  }
}
