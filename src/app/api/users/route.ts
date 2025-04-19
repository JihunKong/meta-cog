import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// 이 라우트는 항상 동적으로 처리됨을 명시
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('GET /api/users 요청 받음');

  try {
    // 쿼리 파라미터에서 옵션 확인
    const { searchParams } = new URL(request.url);
    const fetchRoles = searchParams.get('roles') === 'true';
    const userIds = searchParams.get('ids')?.split(',') || [];
    const role = searchParams.get('role');

    // 사용자 인증 확인
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
    
    // 로그인한 사용자의 역할 확인
    const userRole = user.user_metadata?.role;
    
    // 권한 확인: 교사 또는 관리자만 다른 사용자 정보에 접근 가능
    if (userRole !== 'teacher' && userRole !== 'admin') {
      console.error('권한 오류: 사용자 역할 =', userRole);
      return NextResponse.json(
        { error: '교사나 관리자만 사용자 데이터에 접근할 수 있습니다' },
        { status: 403 }
      );
    }
    
    // 특정 ID 목록이 있는 경우
    if (userIds.length > 0) {
      console.log(`${userIds.length}개의 특정 사용자 ID에 대한 정보 요청`);
      
      // 1. auth.users 테이블에서 데이터 가져오기
      let query = supabaseAdmin.auth.admin.listUsers();
      
      // 2. 결과에서 필요한, 요청된 ID에 해당하는 사용자만 필터링
      const { data: allUsers, error: usersError } = await query;
      
      if (usersError) {
        console.error('auth.users 테이블 조회 오류:', usersError);
        return NextResponse.json(
          { error: '사용자 데이터를 가져오는 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
      
      // 요청된 ID에 해당하는 사용자만 필터링
      const filteredUsers = allUsers.users.filter(user => 
        userIds.includes(user.id)
      ).map(user => ({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        name: user.user_metadata?.name,
        created_at: user.created_at
      }));
      
      return NextResponse.json(filteredUsers);
    }
    
    // 특정 역할이 있는 경우
    if (role) {
      console.log(`역할이 '${role}'인 사용자 정보 요청`);
      
      // 1. auth.users 테이블에서 데이터 가져오기
      const { data: allUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        console.error('auth.users 테이블 조회 오류:', usersError);
        return NextResponse.json(
          { error: '사용자 데이터를 가져오는 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
      
      // 요청된 역할에 해당하는 사용자만 필터링
      const filteredUsers = allUsers.users.filter(user => 
        user.user_metadata?.role === role
      ).map(user => ({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        name: user.user_metadata?.name,
        created_at: user.created_at
      }));
      
      return NextResponse.json(filteredUsers);
    }
    
    // 역할 목록만 요청한 경우
    if (fetchRoles) {
      console.log('사용자 역할 목록 요청');
      
      // auth.users 테이블에서 모든 사용자 가져오기
      const { data: allUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        console.error('auth.users 테이블 조회 오류:', usersError);
        return NextResponse.json(
          { error: '사용자 데이터를 가져오는 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
      
      // 모든 고유 역할 추출
      const roles = [...new Set(
        allUsers.users
          .map(user => user.user_metadata?.role)
          .filter(Boolean)
      )];
      
      return NextResponse.json({ roles });
    }
    
    // 기본: 모든 사용자 정보 반환 (관리자만 가능)
    if (userRole === 'admin') {
      console.log('모든 사용자 정보 요청 (관리자)');
      
      const { data: allUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        console.error('auth.users 테이블 조회 오류:', usersError);
        return NextResponse.json(
          { error: '사용자 데이터를 가져오는 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
      
      // 필요한 정보만 매핑
      const users = allUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        name: user.user_metadata?.name,
        created_at: user.created_at
      }));
      
      return NextResponse.json(users);
    } else {
      // 교사는 모든 사용자 정보를 볼 수 없음
      return NextResponse.json(
        { error: '관리자만 모든 사용자 정보에 접근할 수 있습니다' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 