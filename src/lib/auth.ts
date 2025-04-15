import { supabase } from './supabase';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string, role: string) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
  return { data, error };
}

export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.role || null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
