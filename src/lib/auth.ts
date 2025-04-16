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
      return 'STUDENT'; // 안전한 기본값 반환
    }
    if (!user) {
      console.error('No user found');
      return 'STUDENT'; // 안전한 기본값 반환
    }

    // User 테이블에서 role 조회 시도
    try {
      const { data, error } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('User fetch error:', error);
        return 'STUDENT'; // 안전한 기본값 반환
      }

      if (!data || !data.role) {
        console.log('No role data found, returning STUDENT default');
        return 'STUDENT'; // 안전한 기본값 반환
      }

      console.log('Successfully found role:', data.role);
      return data.role;
    } catch (queryError) {
      console.error('Failed to query User table:', queryError);
      return 'STUDENT'; // 안전한 기본값 반환
    }
  } catch (error) {
    console.error('Unexpected error in getUserRole:', error);
    return 'STUDENT'; // 안전한 기본값 반환
  }
}

export async function getUserName() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return user?.email || '';

    // User 테이블에서 name 조회 시도
    try {
      const { data, error } = await supabase
        .from('User')
        .select('name')
        .eq('id', user.id)
        .single();

      if (error || !data || !data.name) {
        console.log('User name not found, using email:', user.email);
        return user.email || '';
      }

      console.log('Successfully found name:', data.name);
      return data.name;
    } catch (queryError) {
      console.error('Failed to query User table for name:', queryError);
      return user.email || '';
    }
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
