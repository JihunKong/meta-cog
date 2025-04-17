import { createClient } from '@supabase/supabase-js';

// 서비스 역할 키로 관리자 클라이언트 생성
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  'sbp_v0_e82afa87a176af714d3f0b978c3929faaf9bf358' // 개발 환경에서만 사용
);
