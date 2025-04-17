import { supabase } from './supabase';

// 사용자 타입 정의
interface User {
  id: string;
  email?: string;
}

// 로그인 함수
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error && data?.user) await ensureProfile(data.user);
  return { data, error };
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
  if (!user || !user.email) return;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();
  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      role: 'STUDENT',
    });
  }
}

// 로그아웃 함수
export async function signOut() {
  await supabase.auth.signOut();
}