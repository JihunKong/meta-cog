import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabase';

// 사용자 타입 정의
interface User {
  id: string;
  email?: string;
}

// 사용자 역할 정의
export type UserRole = 'student' | 'teacher' | 'admin';

// 로그인 함수
export async function signInWithEmail(email: string, password: string) {
  console.log('로그인 시도:', email);
  
  try {
    const supabase = getSupabaseClient();
    // 인증 시도
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('로그인 오류:', error);
      return { data, error };
    }
    
    if (data?.user) {
      console.log('로그인 성공:', data.user.id);
      
      // 프로필 확인 및 생성
      try {
        await ensureProfile(data.user);
      } catch (profileError) {
        console.error('프로필 처리 중 오류:', profileError);
      }
    }
    
    return { data, error };
  } catch (unexpectedError) {
    console.error('로그인 중 예상치 못한 오류:', unexpectedError);
    return { data: null, error: { message: '예상치 못한 오류가 발생했습니다.' } as any };
  }
}

// 새 계정 생성 함수
export async function signUpWithEmail(email: string, password: string, role: string) {
  const supabase = getSupabaseClient();
  const supabaseAdmin = getSupabaseAdminClient();
  
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
  if (error || !data.user) return { data, error };
  
  // 프로필 생성 (RLS 우회를 위해 supabaseAdmin 사용)
  await supabaseAdmin.from('profiles').upsert({ user_id: data.user.id, email, role });
  return { data, error };
}

// 사용자 권한 확인 함수
export async function getUserRole() {
  try {
    const supabase = getSupabaseClient();
    const supabaseAdmin = getSupabaseAdminClient();
    
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    
    if (!user) {
      console.log('로그인된 사용자 없음');
      return null;
    }
    
    console.log(`사용자 정보 확인: ${user.id}, 이메일: ${user.email}`);
    
    // 1. 먼저 user_metadata에서 역할 확인
    if (user.user_metadata && user.user_metadata.role) {
      const metaRole = normalizeRole(user.user_metadata.role);
      console.log(`메타데이터에서 역할 찾음: ${metaRole}`);
      
      // 메타데이터에서 유효한 역할을 찾았으면 반환
      if (metaRole) {
        await ensureProfile(user); // 프로필 동기화 보장
        return metaRole;
      }
    }
    
    // 2. 메타데이터에 역할이 없으면 profiles 테이블에서 확인
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('프로필 조회 오류:', error.message);
      await ensureProfile(user); // 프로필 생성 시도
      return 'student'; // 기본값
    }
    
    if (profile && profile.role) {
      console.log(`프로필 테이블에서 역할 찾음: ${profile.role}`);
      return normalizeRole(profile.role);
    }
    
    // 3. 프로필이 없거나 역할이 없는 경우 기본값 반환
    console.log('역할을 찾을 수 없어 기본값 student 사용');
    await ensureProfile(user); // 프로필 생성 시도
    return 'student';
  } catch (error) {
    console.error('역할 확인 중 예외 발생:', error);
    return 'student'; // 오류 발생 시 기본값
  }
}

// 역할을 정규화하는 함수
function normalizeRole(role: string | undefined | null): string | null {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // 유효한 역할만 허용
  if (['teacher', 'student', 'admin'].includes(normalizedRole)) {
    return normalizedRole;
  }
  
  console.warn(`유효하지 않은 역할: ${role}, 원본: ${role}`);
  return null;
}

// 메타데이터 역할을 프로필 테이블에 동기화하는 함수
async function syncRoleToProfile(userId: string, role: UserRole, email?: string): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    
    await supabaseAdmin.from('profiles').upsert({
      user_id: userId,
      role,
      email,
      updated_at: new Date().toISOString()
    });
    console.log('프로필 역할 동기화 완료:', role);
  } catch (error) {
    console.error('프로필 역할 동기화 오류:', error);
    throw error;
  }
}

// 사용자 표시 이름 가져오기 함수
export async function getUserName(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const supabaseAdmin = getSupabaseAdminClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // 이메일을 기본 이름으로 사용
    const defaultName = user.email || user.id;
    
    // student_names 테이블에서 이름 조회 시도 (RLS 우회용 서비스 키 사용)
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('student_names')
      .select('display_name')
      .eq('user_id', user.id)
      .single();
    
    // 학생 정보가 없는 경우 기본 이름 반환
    if (studentError || !studentData) {
      console.log('학생 이름 조회 오류 또는 데이터 없음:', studentError ? studentError.message : '데이터 없음');
      return defaultName;
    }
    
    // 표시 이름 반환 (없으면 기본 이름)
    const displayName = studentData.display_name;
    return displayName ? String(displayName) : defaultName;
  } catch (error) {
    console.error("사용자 이름 조회 오류:", error);
    return null;
  }
}

// 로그인/회원가입 후 profiles row가 없으면 자동 생성
export async function ensureProfile(user: User) {
  if (!user || !user.email) {
    console.log('유효하지 않은 사용자 정보');
    return;
  }
  
  try {
    const supabase = getSupabaseClient();
    const supabaseAdmin = getSupabaseAdminClient();
    
    // 프로필 존재 여부 확인 (RLS 우회를 위해 supabaseAdmin 사용)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role')
      .eq('user_id', user.id)
      .single();
    
    // 프로필이 없으면 생성 (RLS 우회를 위해 supabaseAdmin 사용)
    if (!profile) {
      // 메타데이터에서 역할 확인 (없으면 student)
      const { data } = await supabase.auth.getUser();
      const metaRole = data.user?.user_metadata?.role || 'student';
      const normalizedRole = normalizeRole(metaRole) || 'student';
      
      console.log(`프로필 생성 - 사용자 ID: ${user.id}, 역할: ${normalizedRole}`);
      
      await supabaseAdmin.from('profiles').insert({
        user_id: user.id,
        email: user.email,
        role: normalizedRole,
      });
    } else {
      // 사용자의 메타데이터를 확인하기 위해 auth API 호출
      const { data } = await supabase.auth.getUser();
      if (data.user?.user_metadata?.role) {
        const metaRole = data.user.user_metadata.role;
        const normalizedMetaRole = normalizeRole(metaRole);
        
        // 프로필의 역할과 메타데이터의 역할이 다른 경우 동기화
        if (normalizedMetaRole && profile.role !== normalizedMetaRole) {
          console.log(`프로필 역할 업데이트 - 이전: ${profile.role}, 새로운: ${normalizedMetaRole}`);
          await supabaseAdmin.from('profiles').update({
            role: normalizedMetaRole,
            updated_at: new Date().toISOString()
          }).eq('user_id', user.id);
        }
      }
    }
  } catch (error) {
    console.error('프로필 확인/생성 중 예외 발생:', error);
  }
}

// 로그아웃 함수
export async function signOut() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}