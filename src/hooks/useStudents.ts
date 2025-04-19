'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { loadStudentData } from '@/lib/teacher';

interface Student {
  user_id: string;
  email: string | null;
  role: string;
  created_at: string;
  display_name?: string | null;
}

interface StudentRelation {
  student_id: string;
}

interface StudentName {
  user_id: string;
  display_name: string;
}

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  refreshStudents: () => Promise<void>;
  getStudentDetails: (studentId: string) => Promise<any>;
}

export function useStudents(): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 학생 목록 로드 함수
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 클라이언트 측 함수를 사용하여 학생 데이터 로드
      const data = await loadStudentData();
      
      // API 호출이 실패하면 대체 방법으로 직접 Supabase 호출
      if (!data || data.length === 0) {
        console.log('API 호출 실패, 직접 Supabase 호출로 전환');
        const supabase = getSupabaseClient();
        
        // 교사-학생 관계를 통해 학생 조회 시도
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 현재 교사와 연결된 학생 ID 조회
          const { data: relations, error: relationsError } = await supabase
            .from('teacher_student_relations')
            .select('student_id')
            .eq('teacher_id', user.id);
          
          if (relationsError || !relations || relations.length === 0) {
            throw new Error('연결된 학생이 없거나 조회할 수 없습니다');
          }
          
          // 학생 ID 목록
          const studentIds = relations.map((r: StudentRelation) => r.student_id);
          
          // 학생 프로필 조회
          const { data: studentProfiles, error } = await supabase
            .from('profiles')
            .select('user_id, email, role, created_at')
            .in('user_id', studentIds);
          
          if (error || !studentProfiles) {
            throw new Error('학생 프로필을 조회할 수 없습니다');
          }
          
          // 학생 이름 정보 조회
          const { data: studentNames, error: namesError } = await supabase
            .from('student_names')
            .select('user_id, display_name')
            .in('user_id', studentIds);
          
          // 이름 정보 병합
          const enrichedStudents = studentProfiles.map((profile: Student) => {
            const nameInfo = studentNames?.find((n: StudentName) => n.user_id === profile.user_id);
            return {
              ...profile,
              display_name: nameInfo?.display_name || profile.email
            };
          });
          
          setStudents(enrichedStudents);
        }
      } else {
        setStudents(data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('학생 데이터 로드 중 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setLoading(false);
    }
  };
  
  // 학생 상세 정보 조회 함수
  const getStudentDetails = async (studentId: string) => {
    try {
      // 현재 세션에서 토큰 가져오기
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다');
      }
      
      // API 호출
      const response = await fetch(`/api/student-details?studentId=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '학생 상세 정보를 가져오는데 실패했습니다');
      }
      
      return await response.json();
    } catch (error) {
      console.error('학생 상세 정보 로딩 오류:', error);
      throw error;
    }
  };

  // 컴포넌트 마운트 시 학생 데이터 로드
  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    error,
    refreshStudents: fetchStudents,
    getStudentDetails
  };
} 