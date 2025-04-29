import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// 이 라우트는 항상 동적으로 처리됨을 명시
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('GET /api/students 요청 받음');

  try {
    // 사용자 인증 확인
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminServerClient();
    
    // 요청 헤더에서 토큰 확인 (옵션)
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Authorization 헤더에서 토큰 확인됨');
    }
    
    // 현재 로그인된 사용자 정보 가져오기
    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('인증 오류:', authError);
      return NextResponse.json(
        { error: '유효하지 않은 인증 정보입니다' },
        { status: 401 }
      );
    }
    
    // 사용자 역할 확인
    console.log('사용자 메타데이터:', user.user_metadata);
    const role = user.user_metadata?.role;
    
    if (role !== 'teacher' && role !== 'admin') {
      console.error('권한 오류: 사용자 역할 =', role);
      return NextResponse.json(
        { error: '교사나 관리자만 학생 데이터에 접근할 수 있습니다' },
        { status: 403 }
      );
    }
    
    // 교사인 경우, 관련된 학생 데이터만 조회
    if (role === 'teacher') {
      // 1. 먼저 교사-학생 관계를 조회
      const { data: relations, error: relationsError } = await supabase
        .from('teacher_student_relations')
        .select('student_id')
        .eq('teacher_id', user.id);
      
      console.log('교사-학생 관계 조회 결과:', { relations, relationsError });
      
      // 테이블이 없거나 권한 문제가 있을 경우 모든 학생 데이터 반환
      if (relationsError) {
        console.error('교사-학생 관계 조회 오류:', relationsError);
        
        // 모든 학생 데이터 조회 (Admin API 사용)
        const { data: allUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (usersError) {
          console.error('auth.users 테이블 조회 오류:', usersError);
          
          // 프로필 테이블로 대체 조회
          const { data: students, error: studentsError } = await supabaseAdmin
            .from('profiles')
            .select('user_id, email, role, created_at')
            .eq('role', 'student');
            
          if (studentsError) {
            console.error('학생 프로필 직접 조회 오류:', studentsError);
            return NextResponse.json(
              { error: '학생 데이터를 가져오는 중 오류가 발생했습니다' },
              { status: 500 }
            );
          }
          
          // 프로필 데이터 사용
          const studentsWithNames = students?.map(profile => ({
            ...profile,
            display_name: profile.email?.split('@')[0] || '학생'
          }));
          
          console.log(`총 ${studentsWithNames?.length || 0}명의 학생 데이터 반환`);
          return NextResponse.json(studentsWithNames || []);
        }
        
        // auth.users 테이블을 사용하여 학생 사용자 필터링
        const studentUsers = allUsers.users.filter(user => user.user_metadata?.role === 'student')
          .map(user => ({
            user_id: user.id,
            email: user.email,
            role: user.user_metadata?.role,
            created_at: user.created_at,
            display_name: user.user_metadata?.name || user.email?.split('@')[0] || '학생'
          }));
        
        console.log(`총 ${studentUsers.length}명의 학생 데이터 반환 (auth.users)`);
        return NextResponse.json(studentUsers);
      }
      
      // 연결된 학생이 없는 경우
      if (!relations || relations.length === 0) {
        console.log('연결된 학생이 없습니다.');
        return NextResponse.json([]);
      }
      
      // 학생 ID 목록 추출
      const studentIds = relations.map(relation => relation.student_id);
      console.log(`${studentIds.length}명의 학생 ID 확인됨`);
      
      // auth.users 테이블에서 학생 정보 조회
      const { data: allUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        // 프로필 테이블로 대체 조회
        const { data: students, error: studentsError } = await supabaseAdmin
          .from('profiles')
          .select('user_id, email, role, created_at')
          .in('user_id', studentIds);
        
        if (studentsError) {
          return NextResponse.json(
            { error: '학생 데이터를 가져오는 중 오류가 발생했습니다' },
            { status: 500 }
          );
        }
        
        // 학생 이름 정보 조회
        const { data: studentNames, error: namesError } = await supabaseAdmin
          .from('student_names')
          .select('user_id, display_name')
          .in('user_id', studentIds);
          
        if (namesError) {
          console.error('학생 이름 조회 오류:', namesError);
        }
        
        // 이름 정보 병합
        const studentsWithNames = students?.map(profile => {
          const nameInfo = studentNames?.find(n => n.user_id === profile.user_id);
          return {
            ...profile,
            display_name: nameInfo?.display_name || profile.email
          };
        });
        
        console.log(`총 ${studentsWithNames?.length || 0}명의 학생 데이터 반환`);
        return NextResponse.json(studentsWithNames || []);
      }
      
      // auth.users 테이블에서 해당 ID를 가진 학생 사용자 필터링
      const studentUsers = allUsers.users
        .filter(user => studentIds.includes(user.id))
        .map(user => ({
          user_id: user.id,
          email: user.email,
          role: user.user_metadata?.role,
          created_at: user.created_at,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || '학생'
        }));
      
      console.log(`총 ${studentUsers.length}명의 학생 데이터 반환 (auth.users)`);
      return NextResponse.json(studentUsers);
    } 
    
    // 관리자인 경우, 모든 학생 데이터 조회
    else {
      // auth.users 테이블에서 모든 사용자 조회
      const { data: allUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        console.error('auth.users 테이블 조회 오류:', usersError);
        
        // 프로필 테이블로 대체 조회
        const { data: students, error } = await supabaseAdmin
          .from('profiles')
          .select('user_id, email, role, created_at')
          .eq('role', 'student');
        
        if (error) {
          console.error('데이터 조회 오류:', error);
          return NextResponse.json(
            { error: '학생 데이터를 가져오는 중 오류가 발생했습니다' },
            { status: 500 }
          );
        }
        
        // 프로필 데이터 사용
        const studentsWithNames = students?.map(profile => ({
          ...profile,
          display_name: profile.email?.split('@')[0] || '학생'
        }));
        
        console.log(`총 ${studentsWithNames?.length || 0}명의 학생 데이터 반환`);
        return NextResponse.json(studentsWithNames || []);
      }
      
      // auth.users 테이블에서 학생 사용자 필터링
      const studentUsers = allUsers.users
        .filter(user => user.user_metadata?.role === 'student')
        .map(user => ({
          user_id: user.id,
          email: user.email,
          role: user.user_metadata?.role,
          created_at: user.created_at,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || '학생'
        }));
      
      console.log(`총 ${studentUsers.length}명의 학생 데이터 반환 (auth.users)`);
      return NextResponse.json(studentUsers);
    }
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 