import { supabase } from './supabase';

// 사용자 타입 정의
interface User {
  id: string;
  email?: string;
}

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
export async function getUserRole() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!profileError && profileData && profileData.role) return (profileData.role as string).toLowerCase();
    } catch {}
    try {
      const { data: userData, error: userDataError } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!userDataError && userData && userData.role) return (userData.role as string).toLowerCase();
    } catch {}
    if (user.email) {
      const email = user.email.toLowerCase();
      if (email.includes('admin')) return 'admin';
      if (email.startsWith('202') || email.includes('teacher') || email.includes('prof')) return 'teacher';
      if (email.startsWith('2201') || email.includes('student')) return 'student';
    }
    return 'student';
  } catch {
    return 'student';
  }
}

// 사용자 표시 이름 가져오기 함수
export async function getUserName() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return '';
    const email = user.email || '';
    const emailName = email.split('@')[0];
    let { data: studentRow, error: studentError } = await supabase
      .from('student_names')
      .select('display_name, grade, class, student_number')
      .eq('email', email)
      .single();
    if (!studentRow && !studentError) {
      const { error: insertError } = await supabase
        .from('student_names')
        .insert({ email, display_name: emailName, grade: null, class: null, student_number: null });
      if (!insertError) {
        studentRow = { display_name: emailName, grade: null, class: null, student_number: null };
      }
    }
    if (studentRow && studentRow.display_name) {
      if (studentRow.grade && studentRow.class && studentRow.student_number) {
        return `${studentRow.display_name} (${studentRow.grade}${studentRow.class}-${studentRow.student_number})`;
      }
      return studentRow.display_name;
    }
    return emailName;
  } catch {
    return '';
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
    // 프로필 존재 여부 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id.toString()) // 명시적 문자열 변환
      .single();
    
    if (profileError) {
      console.log('프로필 조회 오류:', profileError);
    }
    
    // 프로필이 없으면 생성
    if (!profile) {
      console.log('프로필 생성 시작');
      const { data: insertData, error: insertError } = await supabase.from('profiles').insert({
        id: user.id.toString(), // 명시적 문자열 변환
        email: user.email,
        role: 'STUDENT',
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