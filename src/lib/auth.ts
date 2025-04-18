import { supabase, supabaseAdmin } from '@/lib/supabase';

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
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
  if (error || !data.user) return { data, error };
  
  // 프로필 생성 (RLS 우회를 위해 supabaseAdmin 사용)
  await supabaseAdmin.from('profiles').upsert({ user_id: data.user.id, email, role });
  return { data, error };
}

// 사용자 권한 확인 함수
export async function getUserRole(): Promise<UserRole> {
  try {
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("사용자 정보가 없습니다.");

    console.log("사용자 ID:", user.id); // 디버깅용 로그

    // 프로필 테이블에서 역할 조회 (RLS 우회용 서비스 키 사용)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    // 프로필 조회 에러 처리
    if (profileError) {
      console.error("프로필 조회 오류:", profileError);
      
      // 프로필이 없는 경우, 기본 프로필 생성 시도
      if (profileError.code === 'PGRST116') {
        // 새 프로필 생성 (기본값 student)
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert([{ 
            user_id: user.id, 
            email: user.email, 
            role: 'student' 
          }])
          .select()
          .single();
        
        if (createError) {
          console.error("프로필 생성 오류:", createError);
          return 'student'; // 기본값
        }
        
        return newProfile?.role as UserRole || 'student';
      }
      
      return 'student';
    }
    
    console.log("프로필 데이터:", profileData); // 디버깅용 로그
    
    // 역할 반환 (없으면 기본값 student)
    const role = profileData?.role as string;
    return (role as UserRole) || 'student';
  } catch (error) {
    console.error("사용자 역할 확인 오류:", error);
    return 'student'; // 에러 발생 시 기본값
  }
}

// 사용자 표시 이름 가져오기 함수
export async function getUserName(): Promise<string | null> {
  try {
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
    return studentData.display_name || defaultName;
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
    // 프로필 존재 여부 확인 (RLS 우회를 위해 supabaseAdmin 사용)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    // 프로필이 없으면 생성 (RLS 우회를 위해 supabaseAdmin 사용)
    if (!profile) {
      await supabaseAdmin.from('profiles').insert({
        user_id: user.id,
        email: user.email,
        role: 'student',
      });
    }
  } catch (error) {
    console.error('프로필 확인/생성 중 예외 발생:', error);
  }
}

// 로그아웃 함수
export async function signOut() {
  await supabase.auth.signOut();
}