'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role?: string;
  name?: string;
  created_at: string;
}

interface UseUserDataReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refreshUsers: (options?: { role?: string; ids?: string[] }) => Promise<void>;
  getUsersByIds: (ids: string[]) => Promise<User[]>;
  getUsersByRole: (role: string) => Promise<User[]>;
  getRoles: () => Promise<string[]>;
}

/**
 * 사용자 데이터를 가져오는 React 훅
 * API 라우트를 통해 auth.users 테이블에 접근합니다
 */
export function useUserData(): UseUserDataReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 사용자 정보를 가져오는 함수
   * @param options 옵션 (역할, ID 목록)
   */
  const fetchUsers = async (options?: { role?: string; ids?: string[] }) => {
    setLoading(true);
    setError(null);
    
    try {
      // 현재 세션에서 토큰 가져오기
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다');
      }
      
      // API 요청 URL 구성
      let url = '/api/users';
      const params = new URLSearchParams();
      
      if (options?.role) {
        params.append('role', options.role);
      }
      
      if (options?.ids && options.ids.length > 0) {
        params.append('ids', options.ids.join(','));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // API 호출
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      setUsers(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('사용자 데이터 로드 중 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setLoading(false);
      return [];
    }
  };
  
  /**
   * 특정 ID 목록에 해당하는 사용자를 가져오는 함수
   * @param ids 사용자 ID 목록
   */
  const getUsersByIds = async (ids: string[]) => {
    try {
      if (!ids || ids.length === 0) return [];
      
      // 현재 세션에서 토큰 가져오기
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다');
      }
      
      // API 호출
      const response = await fetch(`/api/users?ids=${ids.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ID로 사용자 로드 중 오류:', error);
      return [];
    }
  };
  
  /**
   * 특정 역할을 가진 사용자를 가져오는 함수
   * @param role 사용자 역할 (예: 'teacher', 'student')
   */
  const getUsersByRole = async (role: string) => {
    try {
      // 현재 세션에서 토큰 가져오기
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다');
      }
      
      // API 호출
      const response = await fetch(`/api/users?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`${role} 역할의 사용자 로드 중 오류:`, error);
      return [];
    }
  };
  
  /**
   * 시스템의 모든 역할 목록을 가져오는 함수
   */
  const getRoles = async () => {
    try {
      // 현재 세션에서 토큰 가져오기
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다');
      }
      
      // API 호출
      const response = await fetch('/api/users?roles=true', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '역할 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      return data.roles || [];
    } catch (error) {
      console.error('역할 목록 로드 중 오류:', error);
      return [];
    }
  };

  // 컴포넌트 마운트 시 사용자 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
    getUsersByIds,
    getUsersByRole,
    getRoles
  };
} 