import { createClient } from '@supabase/supabase-js';

// Netlify에서 Supabase 통합으로 자동 설정된 환경 변수 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// SUPABASE_SERVICE_ROLE_KEY만 사용 (SUPABASE_SERVICE_KEY는 존재하지 않음)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 일반 사용자용 클라이언트 (RLS가 적용됨)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서비스 롤용 클라이언트 (RLS 우회)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase; // fallback to normal client if no service key

console.log('Supabase URL:', supabaseUrl ? '설정됨' : '누락됨');
console.log('Supabase Anon Key:', supabaseAnonKey ? '설정됨' : '누락됨');
console.log('Supabase Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '누락됨');
