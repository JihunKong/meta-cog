import { createClient } from '@supabase/supabase-js';

// Netlify에서 Supabase 통합으로 자동 설정된 환경 변수 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 일반 사용자용 클라이언트 (RLS가 적용됨)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 확실한 supabaseAdmin 클라이언트 구성을 위한 하드코딩된 키 (개발용으로만 사용, 프로덕션에서는 환경 변수 사용)
const hardcodedServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjExODgxNCwiZXhwIjoyMDU3Njk0ODE0fQ.dT1-dsN3MUeigfKRaK97UBg_pV7Cx88rh_dnwxlHiLY';

// 서비스 롤용 클라이언트 (RLS 우회) - 하드코딩된 키를 사용하거나 환경 변수 사용
export const supabaseAdmin = createClient(
  supabaseUrl, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || hardcodedServiceKey
);

// 환경 변수 상태 로깅
console.log('Supabase URL:', supabaseUrl ? '설정됨' : '누락됨');
console.log('Supabase Anon Key:', supabaseAnonKey ? '설정됨' : '누락됨');
console.log('Supabase Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '하드코딩된 키 사용');
