import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// 일반 사용자용 클라이언트 (RLS가 적용됨)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서비스 롤용 클라이언트 (RLS 우회)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY)
  : supabase; // fallback to normal client if no service key
