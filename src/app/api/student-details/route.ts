import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// 이 라우트는 항상 동적으로 처리됨을 명시
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('GET /api/student-details 요청 받음');

  try {
    // 쿼리 파라미터에서 학생 ID 가져오기
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다' },
        { status: 400 }
      );
    }

    console.log(`학생 ID: ${studentId} 에 대한 상세 정보 요청`);

    // 사용자 인증 확인
    const supabase = createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    // 학생 정보 조회 (profiles 테이블)
    const { data: studentProfile, error: studentProfileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', studentId)
      .single();
    if (studentProfileError || !studentProfile) {
      return NextResponse.json(
        { error: '학생 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 사용자 역할 확인
    const role = studentProfile.role;
    
    if (role !== 'teacher' && role !== 'admin') {
      console.error('권한 오류: 사용자 역할 =', role);
      return NextResponse.json(
        { error: '교사나 관리자만 학생 데이터에 접근할 수 있습니다' },
        { status: 403 }
      );
    }
    
    // 교사인 경우, 관련된 학생인지 확인
    if (role === 'teacher') {
      // 교사-학생 관계 확인
      const { data: relation, error: relationError } = await supabase
        .from('teacher_student_relations')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', studentId)
        .single();
      
      // 관계가 없고 오류가 있는 경우 (테이블이 없거나 권한 문제)
      if (relationError && relationError.code !== 'PGRST116') { // PGRST116: Results contain 0 rows
        console.log('교사-학생 관계 테이블 접근 오류, 기본 접근으로 전환:', relationError);
        // 접근 허용 (테이블이 없는 경우 대비)
      } 
      // 관계가 없는 경우 (학생이 교사에게 배정되지 않음)
      else if (!relation && relationError?.code === 'PGRST116') {
        console.error('이 교사에게 배정되지 않은 학생입니다');
        return NextResponse.json(
          { error: '해당 학생에 대한 접근 권한이 없습니다' },
          { status: 403 }
        );
      }

      console.log('교사-학생 관계 확인됨');
    }
    
    // 1. 학생 프로필 정보 조회
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', studentId)
      .single();
    
    if (profileError) {
      console.error('학생 프로필 조회 오류:', profileError);
      return NextResponse.json(
        { error: '학생 프로필을 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    // 2. 학생 이름 정보 조회
    const { data: studentName, error: nameError } = await supabaseAdmin
      .from('student_names')
      .select('display_name')
      .eq('user_id', studentId)
      .single();
    
    // 3. 학생의 목표 정보 조회
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('smart_goals')
      .select('id, description, subject, created_at')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });
    
    if (goalsError) {
      console.error('학생 목표 조회 오류:', goalsError);
    }
    
    // 4. 학생의 세션 정보 조회
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('id, created_at, duration, feedback, smart_goal_id')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (sessionsError) {
      console.error('학생 세션 조회 오류:', sessionsError);
    }
    
    // 5. 학생의 목표 진행 상황 조회
    let goalProgress = [];
    if (goals && goals.length > 0) {
      const goalIds = goals.map(g => g.id);
      const { data: progress, error: progressError } = await supabaseAdmin
        .from('goal_progress')
        .select('*')
        .in('smart_goal_id', goalIds);
      
      if (!progressError && progress) {
        goalProgress = progress;
      } else {
        console.error('목표 진행 상황 조회 오류:', progressError);
      }
    }
    
    // 6. 모든 데이터 조합
    const studentDetails = {
      profile: {
        ...profile,
        display_name: studentName?.display_name || profile.email
      },
      goals: goals || [],
      sessions: sessions || [],
      goalProgress: goalProgress
    };
    
    console.log(`학생 상세 정보 반환 완료`);
    return NextResponse.json(studentDetails);
    
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 