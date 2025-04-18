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
      console.error('오류 코드:', error.status);
      console.error('오류 메시지:', error.message);
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
    } else {
      console.warn('로그인 성공했지만 사용자 정보 없음');
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
  await supabase.from('profiles').upsert({ id: data.user.id, email, role });
  return { data, error };
}

// 사용자 권한 확인 함수
export async function getUserRole(): Promise<UserRole> {
  try {
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("사용자 정보가 없습니다.");

    console.log("로그인 사용자:", user.id);
    
    // 프로필 테이블에서 역할 조회 (RLS 우회용 서비스 키 사용)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    // 프로필 조회 에러 처리
    if (profileError) {
      console.error("프로필 조회 오류:", profileError);
      
      // 프로필이 없는 경우, 기본 프로필 생성 시도
      if (profileError.code === 'PGRST116') {
        console.log("프로필 생성 시작");
        
        // 새 프로필 생성 (기본값 student)
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert([
            { 
              id: user.id, 
              email: user.email, 
              role: 'student' 
            }
          ])
          .select()
          .single();
        
        if (createError) {
          console.error("프로필 생성 오류:", createError);
          console.error("오류 코드:", createError.code);
          console.error("오류 메시지:", createError.message);
          console.error("오류 세부 정보:", createError.details);
          return 'student'; // 기본값
        }
        
        return newProfile?.role as UserRole || 'student';
      }
      
      // 다른 오류인 경우 기본값 반환
      return 'student';
    }
    
    // 역할 반환 (없으면 기본값 student)
    return (profileData?.role || 'student') as UserRole;
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
      .eq('id', user.id)
      .single();
    
    // 학생 정보가 없는 경우 기본 이름 반환
    if (studentError || !studentData) {
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
    console.log('유효하지 않은 사용자 정보:', user);
    return;
  }
  
  console.log('프로필 확인 중:', user.id);
  
  try {
    // 프로필 존재 여부 확인 (RLS 우회를 위해 supabaseAdmin 사용)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id.toString()) // 명시적 문자열 변환
      .single();
    
    if (profileError) {
      console.log('프로필 조회 오류:', profileError);
    }
    
    // 프로필이 없으면 생성 (RLS 우회를 위해 supabaseAdmin 사용)
    if (!profile) {
      console.log('프로필 생성 시작');
      const { data: insertData, error: insertError } = await supabaseAdmin.from('profiles').insert({
        id: user.id.toString(), // 명시적 문자열 변환
        email: user.email,
        role: 'student', // 소문자로 통일
      });
      
      if (insertError) {
        console.error('프로필 생성 오류:', insertError);
        console.error('오류 코드:', insertError.code);
        console.error('오류 메시지:', insertError.message);
        console.error('오류 세부 정보:', insertError.details);
      } else {
        console.log('프로필 생성 성공');
      }
    } else {
      console.log('기존 프로필 발견:', profile.id);
    }
  } catch (error) {
    console.error('프로필 확인/생성 중 예외 발생:', error);
  }
}

// 로그아웃 함수
export async function signOut() {
  await supabase.auth.signOut();
}