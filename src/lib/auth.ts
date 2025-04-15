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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role || null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
