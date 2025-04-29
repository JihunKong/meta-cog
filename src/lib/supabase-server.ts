import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * 서버 컴포넌트에서 사용할 Supabase 클라이언트를 생성합니다.
 * 쿠키를 통해 인증 상태를 유지합니다.
 * @returns Supabase 클라이언트
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 개발 환경에서는 쿠키 설정 오류가 발생할 수 있음
            console.error('쿠키 설정 오류:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.error('쿠키 삭제 오류:', error);
          }
        },
      },
    }
  );

  return supabase;
}

/**
 * 서버 컴포넌트에서 서비스 롤 권한의 Supabase 클라이언트를 생성합니다.
 * RLS 정책을 우회하고 모든 테이블에 접근할 수 있습니다.
 * 사용자 정보 조회, auth.users 접근 등에 사용합니다.
 * @returns 서비스 롤 권한의 Supabase 클라이언트
 */
export function createSupabaseAdminServerClient() {
  // 서비스 롤 키 확인
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    throw new Error('서버 환경 변수가 올바르게 설정되지 않았습니다.');
  }

  // Admin 권한으로 Supabase 클라이언트 생성
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Admin API 확인
  if (!supabaseAdmin.auth.admin) {
    console.warn('Supabase Admin API를 사용할 수 없습니다. 서비스 롤 키를 확인하세요.');
  }

  return supabaseAdmin;
} 