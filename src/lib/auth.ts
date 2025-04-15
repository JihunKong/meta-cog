import { supabase } from './supabase';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError) {
    console.error('Profile fetch error:', profileError);
    return null;
  }
  if (!profile) {
    console.error('No profile found for user:', user.id);
    return null;
  }
  return profile.role || null;
}

// 로그인/회원가입 후 profiles row가 없으면 자동 생성
export async function ensureProfile(user) {
  if (!user) return;
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
