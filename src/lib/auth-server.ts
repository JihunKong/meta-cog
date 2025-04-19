import { createSupabaseServerClient, createSupabaseAdminServerClient } from './supabase-server';
import { User } from '@supabase/supabase-js';

// 사용자 역할 정의
export type UserRole = 'student' | 'teacher' | 'admin';

// 서버에서 사용자 역할 조회 함수
export async function getUserRoleFromServer(userId: string): Promise<string | null> {
  try {
    const supabase = createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    // 1. 사용자 메타데이터에서 역할 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('인증 정보 조회 오류:', authError);
      return null;
    }
    
    if (user?.user_metadata?.role) {
      const metaRole = normalizeRole(user.user_metadata.role);
      if (metaRole) {
        console.log(`메타데이터에서 역할 찾음: ${metaRole}`);
        await ensureProfileOnServer(user); // 프로필 동기화
        return metaRole;
      }
    }
    
    // 2. profiles 테이블에서 조회
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.error('프로필 조회 오류:', profileError);
      return 'student'; // 기본값
    }
    
    if (profile?.role) {
      return normalizeRole(profile.role) || 'student';
    }
    
    return 'student'; // 기본값
  } catch (error) {
    console.error('서버 측 역할 조회 오류:', error);
    return 'student'; // 기본값
  }
}

// 서버에서 프로필 생성/확인
export async function ensureProfileOnServer(user: User) {
  if (!user || !user.email) {
    console.log('유효하지 않은 사용자 정보');
    return;
  }
  
  try {
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    // 프로필 존재 여부 확인
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role')
      .eq('user_id', user.id)
      .single();
    
    // 프로필이 없으면 생성
    if (!profile) {
      const metaRole = user.user_metadata?.role || 'student';
      const normalizedRole = normalizeRole(metaRole) || 'student';
      
      console.log(`프로필 생성 - 사용자 ID: ${user.id}, 역할: ${normalizedRole}`);
      
      await supabaseAdmin.from('profiles').insert({
        user_id: user.id,
        email: user.email,
        role: normalizedRole,
      });
    } else if (user.user_metadata?.role) {
      // 메타데이터와 프로필 역할이 다르면 동기화
      const metaRole = user.user_metadata.role;
      const normalizedMetaRole = normalizeRole(metaRole);
      
      if (normalizedMetaRole && profile.role !== normalizedMetaRole) {
        console.log(`프로필 역할 업데이트 - 이전: ${profile.role}, 새로운: ${normalizedMetaRole}`);
        await supabaseAdmin.from('profiles').update({
          role: normalizedMetaRole,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
      }
    }
  } catch (error) {
    console.error('서버 측 프로필 처리 오류:', error);
  }
}

// 서버에서 학생 표시 이름 조회
export async function getStudentNameFromServer(userId: string): Promise<string | null> {
  try {
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    // 학생 이름 조회
    const { data: student, error } = await supabaseAdmin
      .from('student_names')
      .select('display_name')
      .eq('user_id', userId)
      .single();
    
    if (error || !student?.display_name) {
      console.error('학생 이름 조회 오류:', error?.message || '이름 없음');
      return null;
    }
    
    return student.display_name;
  } catch (error) {
    console.error('서버 측 학생 이름 조회 오류:', error);
    return null;
  }
}

// 역할 정규화 함수
function normalizeRole(role: string | undefined | null): string | null {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // 유효한 역할만 허용
  if (['teacher', 'student', 'admin'].includes(normalizedRole)) {
    return normalizedRole;
  }
  
  console.warn(`유효하지 않은 역할: ${role}`);
  return null;
} 