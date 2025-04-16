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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Auth error:', userError);
    return null;
  }
  if (!user) {
    console.error('No user found');
    return null;
  }

  // User row가 없으면 자동 생성 (STUDENT 기본)
  let { data, error } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // Row not found, upsert
    const upsertResult = await supabase.from('User').upsert({
      id: user.id,
      email: user.email,
      name: user.email,
      role: 'STUDENT',
    });
    if (upsertResult.error) {
      console.error('User upsert error:', upsertResult.error);
      return null;
    }
    // 재조회
    const retry = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();
    data = retry.data;
  }
  if (!data) {
    console.error('No User row found for user:', user.id);
    return null;
  }
  return data.role || null;
}

export async function getUserName() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  let { data, error } = await supabase
    .from('User')
    .select('name')
    .eq('id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // Row not found, upsert
    const upsertResult = await supabase.from('User').upsert({
      id: user.id,
      email: user.email,
      name: user.email,
      role: 'STUDENT',
    });
    if (upsertResult.error) {
      console.error('User upsert error:', upsertResult.error);
      return null;
    }
    // 재조회
    const retry = await supabase
      .from('User')
      .select('name')
      .eq('id', user.id)
      .single();
    data = retry.data;
  }
  if (!data) return null;
  return data.name;
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
