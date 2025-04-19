import { createSupabaseServerClient, createSupabaseAdminServerClient } from './supabase-server';

interface StudentRelation {
  student_id: string;
}

interface StudentProfile {
  user_id: string;
  email: string | null;
  created_at: string;
  role: string;
}

interface StudentName {
  user_id: string;
  display_name: string;
}

/**
 * 서버에서 교사와 연결된 학생 목록을 조회하는 함수
 * @param teacherId 교사 ID
 * @returns 학생 프로필 정보 배열
 */
export async function getTeacherStudentsFromServer(teacherId: string) {
  try {
    console.log('서버에서 학생 데이터 로딩 시작...');
    const supabase = createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    // 1. 먼저 교사-학생 관계를 조회
    const { data: relations, error: relationsError } = await supabase
      .from('teacher_student_relations')
      .select('student_id')
      .eq('teacher_id', teacherId);
    
    if (relationsError) {
      console.error('교사-학생 관계 조회 오류:', relationsError);
      return [];
    }
    
    if (!relations || relations.length === 0) {
      console.log('연결된 학생이 없습니다.');
      return [];
    }
    
    // 2. 학생 ID 목록 추출
    const studentIds = relations.map((relation: StudentRelation) => relation.student_id);
    
    // 3. 학생 프로필 정보 조회 (RLS 우회를 위해 Admin 클라이언트 사용)
    const { data: studentProfiles, error } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, created_at, role')
      .in('user_id', studentIds);
    
    if (error) {
      console.error('학생 프로필 조회 오류:', error);
      return [];
    }
    
    // 4. 학생 이름 정보 조회
    const { data: studentNames, error: namesError } = await supabaseAdmin
      .from('student_names')
      .select('user_id, display_name')
      .in('user_id', studentIds);
      
    if (namesError) {
      console.error('학생 이름 조회 오류:', namesError);
    }
    
    // 5. 프로필과 이름 정보 병합
    const studentsWithNames = studentProfiles?.map((profile: StudentProfile) => {
      const nameInfo = studentNames?.find((n: StudentName) => n.user_id === profile.user_id);
      return {
        ...profile,
        display_name: nameInfo?.display_name || profile.email
      };
    });
    
    console.log(`학생 데이터 로드 완료: ${studentsWithNames?.length || 0} 명`);
    return studentsWithNames || [];
    
  } catch (error) {
    console.error('학생 데이터 로딩 오류:', error);
    return [];
  }
}

/**
 * 서버에서 학생을 교사와 연결하는 함수
 * @param teacherId 교사 ID
 * @param studentId 학생 ID
 * @returns 성공 여부
 */
export async function connectStudentToTeacherFromServer(teacherId: string, studentId: string) {
  try {
    console.log(`교사(${teacherId})와 학생(${studentId}) 연결 시도...`);
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    // 이미 연결되어 있는지 확인
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('teacher_student_relations')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .single();
      
    if (existing) {
      console.log('이미 연결된 관계입니다.');
      return true;
    }
    
    // 새 관계 생성
    const { error } = await supabaseAdmin
      .from('teacher_student_relations')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('교사-학생 연결 오류:', error);
      return false;
    }
    
    console.log('교사-학생 연결 성공');
    return true;
    
  } catch (error) {
    console.error('교사-학생 연결 중 오류 발생:', error);
    return false;
  }
}

/**
 * 서버에서 학생과 교사의 연결을 해제하는 함수
 * @param teacherId 교사 ID
 * @param studentId 학생 ID
 * @returns 성공 여부
 */
export async function disconnectStudentFromTeacherFromServer(teacherId: string, studentId: string) {
  try {
    console.log(`교사(${teacherId})와 학생(${studentId}) 연결 해제 시도...`);
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    const { error } = await supabaseAdmin
      .from('teacher_student_relations')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId);
      
    if (error) {
      console.error('교사-학생 연결 해제 오류:', error);
      return false;
    }
    
    console.log('교사-학생 연결 해제 성공');
    return true;
    
  } catch (error) {
    console.error('교사-학생 연결 해제 중 오류 발생:', error);
    return false;
  }
} 