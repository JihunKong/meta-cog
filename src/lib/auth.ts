import { supabase } from './supabase';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  // 로그인 성공 시 사용자 프로필 자동 확인/생성
  if (!error && data?.user) {
    await ensureProfile(data.user);
  }
  
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string, role: string) {
  // 1. Supabase 인증 계정 생성
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
  if (error || !data.user) return { data, error };

  // 2. profiles 테이블에도 동기화
  await supabase
    .from('profiles')
    .upsert({ id: data.user.id, email, role });

  return { data, error };
}

export async function getUserRole() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Auth error:', userError);
      return null; // 오류 시 null 반환
    }
    if (!user) {
      console.error('No user found');
      return null; // 오류 시 null 반환
    }

    console.log('Checking role for user ID:', user.id);

    // 1. 먼저 profiles 테이블에서 role 조회 시도
    try {
      // Supabase PostgREST API 쿼리 형식 수정
      console.log('Querying profiles table with ID:', user.id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id) // 이것이 URL에서 ?eq.id=... 형식으로 변환됨
        .single();

      console.log('Profiles query result:', { data: profileData, error: profileError });

      if (!profileError && profileData && profileData.role) {
        // Enum 타입에 맞게 소문자로 변환 (admin, teacher, student)
        const role = (profileData.role as string).toLowerCase();
        console.log('Found role in profiles:', role);
        return role;
      }
    } catch (profileQueryError) {
      console.error('Failed to query profiles table:', profileQueryError);
    }

    // 2. User 테이블에서 role 조회 시도
    try {
      console.log('Querying User table with ID:', user.id);
      const { data: userData, error: userDataError } = await supabase
        .from('User') // 테이블 이름은 따옴표 없이 그대로 사용
        .select('role')
        .eq('id', user.id) // 이것이 URL에서 ?eq.id=... 형식으로 변환됨
        .single();

      console.log('User table query result:', { data: userData, error: userDataError });

      if (!userDataError && userData && userData.role) {
        // Enum 타입에 맞게 소문자로 변환
        const role = (userData.role as string).toLowerCase();
        console.log('Found role in User table:', role);
        return role;
      }
    } catch (userQueryError) {
      console.error('Failed to query User table:', userQueryError);
    }

    // 3. 이메일에서 권한 추측
    if (user.email) {
      const email = user.email.toLowerCase();
      console.log('Identifying role from email pattern:', email);
      
      // 관리자 패턴 검사 (소문자 반환)
      if (email.includes('admin')) {
        console.log('Email pattern match: admin');
        return 'admin';
      } 
      
      // 교사 패턴 검사 (소문자 반환)
      if (email.startsWith('202') || 
          email.includes('teacher') || 
          email.includes('prof')) {
        console.log('Email pattern match: teacher');
        return 'teacher';
      } 
      
      // 학생 패턴 검사 (소문자 반환)
      if (email.startsWith('2201') || 
          email.includes('student')) {
        console.log('Email pattern match: student');
        return 'student';
      }
    }

    // 4. 모든 방법 실패시 최종 안전장치 (기본값, 소문자)
    console.log('All role detection methods failed, returning student default');
    return 'student';
  } catch (error) {
    console.error('Unexpected error in getUserRole:', error);
    return 'student';
  }
}

export async function getUserName() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('No authenticated user found for getName');
      return '';
    }
    const email = user.email || '';
    const emailName = email.split('@')[0];

    // student_names 테이블에서 이름, 학년, 반, 번호 조회
    let { data: studentRow, error: studentError } = await supabase
      .from('student_names')
      .select('display_name, grade, class, student_number')
      .eq('email', email)
      .single();
    if (!studentRow && !studentError) {
      // row가 없으면 자동 생성
      const { error: insertError } = await supabase
        .from('student_names')
        .insert({ email, display_name: emailName, grade: null, class: null, student_number: null });
      if (!insertError) {
        studentRow = { display_name: emailName, grade: null, class: null, student_number: null };
      }
    }
    if (studentRow && studentRow.display_name) {
      // 학년/반/번호 정보가 모두 있으면 "이름 (학년반-번호)" 형식
      if (studentRow.grade && studentRow.class && studentRow.student_number) {
        return `${studentRow.display_name} (${studentRow.grade}${studentRow.class}-${studentRow.student_number})`;
      }
      return studentRow.display_name;
    }
    // fallback: 이메일 앞부분
    return emailName;
  } catch (error) {
    console.error('Unexpected error in getUserName:', error);
    return '';
  }
}

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('No authenticated user found for getName');
      return '';
    }
    const email = user.email || '';
    const emailName = email.split('@')[0];

    // 1. student_names 테이블에서 이름 가져오기(없으면 자동 생성)
    let { data: studentRow, error: studentError } = await supabase
      .from('student_names')
      .select('display_name')
      .eq('email', email)
      .single();
    if (!studentRow && !studentError) {
      // row가 없으면 자동 생성
      const { error: insertError } = await supabase
        .from('student_names')
        .insert({ email, display_name: emailName });
      if (!insertError) {
        studentRow = { display_name: emailName };
      }
    }
    if (studentRow && studentRow.display_name) {
      return studentRow.display_name;
    }
    // fallback: 이메일 앞부분
    return emailName;
  } catch (error) {
    console.error('Unexpected error in getUserName:', error);
    return '';
  }


      } catch (studentNameQueryError) {
        console.error('Failed to query student_names table:', studentNameQueryError);
      }
    }



// Supabase 사용자 타입 정의
interface User {
  id: string;
  email?: string;
}

// 로그인/회원가입 후 profiles row가 없으면 자동 생성
export async function ensureProfile(user: User) {
  if (!user || !user.email) return;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();
  if (!profile) {
    // 기본 role은 STUDENT, 필요시 프론트에서 다르게 지정 가능
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      role: 'STUDENT',
    });
  }
}


export async function signOut() {
  await supabase.auth.signOut();
}
