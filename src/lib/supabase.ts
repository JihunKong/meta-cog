/// <reference types="@supabase/supabase-js" />

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 일반 사용자용 클라이언트 (RLS가 적용됨)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 관리자용 클라이언트 (서버에서만 사용)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

// 환경 변수 디버깅용 로그
if (process.env.NODE_ENV !== 'production') {
  console.log('Supabase 환경:', {
    url: supabaseUrl ? '설정됨' : '없음',
    anonKey: supabaseAnonKey ? '설정됨' : '없음',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음'
  });
}

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
