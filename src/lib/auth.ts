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

    console.log('Getting name for user:', user.id, user.email);
    
    // 0. 기본 사용자 정보 (역할별 기본 이름)
    const roleBasedNames: {[role: string]: string} = {
      'admin': '관리자',
      'teacher': '교사',
      'student': '학생'
    };
    
    // 1. student_names 테이블에서 이름 가져오기 시도 (학생에게 가장 우선순위)
    if (user.email) {
      try {
        const { data: studentNameData, error: studentNameError } = await supabase
          .from('student_names')
          .select('display_name, grade, class, student_number')
          .eq('email', user.email)
          .single();

        if (!studentNameError && studentNameData && studentNameData.display_name) {
          console.log('Found name in student_names table:', studentNameData.display_name);
          
          // 학년반호 정보가 있으면 함께 표시
          if (studentNameData.grade && studentNameData.class && studentNameData.student_number) {
            const fullInfo = `${studentNameData.display_name} (${studentNameData.grade}${studentNameData.class}-${studentNameData.student_number})`;
            console.log('Using full student info:', fullInfo);
            return fullInfo;
          }
          
          return studentNameData.display_name;
        }
      } catch (studentNameQueryError) {
        console.error('Failed to query student_names table:', studentNameQueryError);
      }
    }

    // 2. User 테이블에서 이름 가져오기 시도
    try {
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (!userError && userData) {
        // 이름이 존재하면 사용
        if (userData.name && userData.name.length > 1) {
          console.log('Found valid name in User table:', userData.name);
          return userData.name;
        }
        
        // 역할에 따른 기본 이름 사용
        if (userData.role && roleBasedNames[userData.role]) {
          console.log('Using role-based name from User table:', roleBasedNames[userData.role]);
          return roleBasedNames[userData.role];
        }
      }
    } catch (userQueryError) {
      console.error('Failed to query User table for name:', userQueryError);
    }

    // 3. profiles 테이블에서 이름 검색 시도
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        // 이름이 존재하면 사용
        if (profileData.name && profileData.name.length > 1) {
          console.log('Found valid name in profiles table:', profileData.name);
          return profileData.name;
        }
        
        // 역할에 따른 기본 이름 사용
        if (profileData.role && roleBasedNames[profileData.role]) {
          console.log('Using role-based name from profiles table:', roleBasedNames[profileData.role]);
          return roleBasedNames[profileData.role];
        }
      }
    } catch (profileQueryError) {
      console.error('Failed to query profiles table for name:', profileQueryError);
    }
    
    // 4. user_metadata에서 이름 가져오기 시도
    if (user.user_metadata && user.user_metadata.name) {
      console.log('Found name in user_metadata:', user.user_metadata.name);
      return user.user_metadata.name;
    }

    // 5. 이메일 기반 처리
    if (user.email) {
      // 특정 패턴을 가진 이메일의 경우 문구 생성
      const email = user.email.toLowerCase();
      const emailName = email.split('@')[0];
      
      // 역할 키워드가 이메일에 포함된 경우 처리
      if (email.includes('student') || email.includes('teacher') || email.includes('admin')) {
        let role = 'student';
        if (email.includes('teacher')) role = 'teacher';
        else if (email.includes('admin')) role = 'admin';
        
        console.log('Using role-based description for email:', email);
        return `${emailName} ${roleBasedNames[role]}`;
      }
      
      console.log('Using email username as name:', emailName);
      return emailName;
    }

    return '';
  } catch (error) {
    console.error('Unexpected error in getUserName:', error);
    return '';
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
