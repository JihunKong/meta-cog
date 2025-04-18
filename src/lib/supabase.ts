/// <reference types="@supabase/supabase-js" />

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 서버 측에서만 사용할 서비스 롤 키 (클라이언트에서는 undefined)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 일반 사용자용 클라이언트 (RLS가 적용됨) - 클라이언트와 서버 모두에서 사용
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// 클라이언트와 서버에서 다른 방식으로 동작하는 관리자 클라이언트
export const supabaseAdmin = createAdminClient();

// 서버와 클라이언트에 따라 다른 클라이언트 생성
function createAdminClient() {
  // 서버 측에서는 서비스 롤 키가 있으면 그것을 사용
  if (supabaseServiceRoleKey) {
    return createClient(supabaseUrl || '', supabaseServiceRoleKey);
  }
  
  // 서비스 키가 없으면 일반 클라이언트 반환 (클라이언트 측에서는 이렇게 동작)
  return supabase;
}

// 환경 변수 디버깅용 로그
if (process.env.NODE_ENV !== 'production') {
  console.log('Supabase 환경:', {
    url: supabaseUrl ? '설정됨' : '없음',
    anonKey: supabaseAnonKey ? '설정됨' : '없음',
    serviceKey: supabaseServiceRoleKey ? '설정됨' : '없음'
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
