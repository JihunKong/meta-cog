import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 서버에서 동적으로 실행되도록 설정
export const dynamic = 'force-dynamic';

// 공지사항 조회 API
export async function GET(request: Request) {
  try {
    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('API 오류: Supabase 환경 변수가 설정되지 않음');
      return NextResponse.json({ 
        error: 'Supabase 환경 변수가 설정되지 않았습니다' 
      }, { status: 500 });
    }
    
    // Supabase 클라이언트 생성
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('인증 오류:', authError || '사용자 정보를 찾을 수 없음');
      return NextResponse.json({
        error: '인증에 실패했습니다',
        details: authError?.message
      }, { status: 401 });
    }
    
    // 쿼리 준비
    let query = supabase
      .from('teacher_announcements')
      .select('*, teacher_profiles(display_name)')
      .order('created_at', { ascending: false });
    
    // 특정 클래스에 대한 공지사항만 필터링
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    // 데이터 조회 실행
    const { data, error } = await query;
    
    if (error) {
      console.error('공지사항 조회 오류:', error);
      return NextResponse.json({ 
        error: '공지사항을 불러오는 중 오류가 발생했습니다',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ data });
    
  } catch (error: any) {
    console.error('API 예외 발생:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다' 
    }, { status: 500 });
  }
}

// 공지사항 생성 API
export async function POST(request: Request) {
  try {
    // 요청 데이터 파싱
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('요청 데이터 파싱 오류:', parseError);
      return NextResponse.json({ 
        error: '유효하지 않은 요청 형식입니다' 
      }, { status: 400 });
    }
    
    const { title, content, class_id } = requestData;
    
    // 필수 필드 검증
    if (!title || !content) {
      console.error('유효성 검사 실패: 필수 필드 누락', { title: !!title, content: !!content });
      return NextResponse.json({ 
        error: '제목과, 내용은 필수 입력사항입니다' 
      }, { status: 400 });
    }
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('API 오류: Supabase 환경 변수가 설정되지 않음');
      return NextResponse.json({ 
        error: 'Supabase 환경 변수가 설정되지 않았습니다' 
      }, { status: 500 });
    }
    
    // Supabase 클라이언트 생성
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('인증 오류:', authError || '사용자 정보를 찾을 수 없음');
      return NextResponse.json({
        error: '인증에 실패했습니다',
        details: authError?.message
      }, { status: 401 });
    }
    
    // 교사 프로필 정보 확인
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (teacherError || !teacherData) {
      console.error('교사 권한 확인 오류:', teacherError || '교사 프로필이 없습니다');
      return NextResponse.json({
        error: '교사 권한이 없습니다',
        details: teacherError?.message
      }, { status: 403 });
    }
    
    // 공지사항 등록
    const { data, error } = await supabase
      .from('teacher_announcements')
      .insert({
        teacher_id: teacherData.id,
        title,
        content,
        class_id: class_id || null, // 선택적으로 클래스 ID 추가
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) {
      console.error('공지사항 등록 오류:', error);
      return NextResponse.json({ 
        error: '공지사항 등록 중 오류가 발생했습니다',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: '공지사항이 성공적으로 등록되었습니다' 
    });
    
  } catch (error: any) {
    console.error('API 예외 발생:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다' 
    }, { status: 500 });
  }
}

// 공지사항 수정 API
export async function PUT(request: Request) {
  try {
    // 요청 데이터 파싱
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('요청 데이터 파싱 오류:', parseError);
      return NextResponse.json({ 
        error: '유효하지 않은 요청 형식입니다' 
      }, { status: 400 });
    }
    
    const { id, title, content, class_id } = requestData;
    
    // 필수 필드 검증
    if (!id) {
      console.error('유효성 검사 실패: id 누락');
      return NextResponse.json({ 
        error: '공지사항 ID가 필요합니다' 
      }, { status: 400 });
    }
    
    if (!title || !content) {
      console.error('유효성 검사 실패: 필수 필드 누락', { title: !!title, content: !!content });
      return NextResponse.json({ 
        error: '제목과 내용은 필수 입력사항입니다' 
      }, { status: 400 });
    }
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('API 오류: Supabase 환경 변수가 설정되지 않음');
      return NextResponse.json({ 
        error: 'Supabase 환경 변수가 설정되지 않았습니다' 
      }, { status: 500 });
    }
    
    // Supabase 클라이언트 생성
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('인증 오류:', authError || '사용자 정보를 찾을 수 없음');
      return NextResponse.json({
        error: '인증에 실패했습니다',
        details: authError?.message
      }, { status: 401 });
    }
    
    // 교사 프로필 정보 확인
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (teacherError || !teacherData) {
      console.error('교사 권한 확인 오류:', teacherError || '교사 프로필이 없습니다');
      return NextResponse.json({
        error: '교사 권한이 없습니다',
        details: teacherError?.message
      }, { status: 403 });
    }
    
    // 수정할 공지사항이 본인 것인지 확인
    const { data: announcementData, error: announcementError } = await supabase
      .from('teacher_announcements')
      .select('teacher_id')
      .eq('id', id)
      .single();
    
    if (announcementError) {
      console.error('공지사항 조회 오류:', announcementError);
      return NextResponse.json({ 
        error: '공지사항을 찾을 수 없습니다',
        details: announcementError.message
      }, { status: 404 });
    }
    
    if (announcementData.teacher_id !== teacherData.id) {
      console.error('권한 오류: 다른 교사의 공지사항 수정 시도');
      return NextResponse.json({
        error: '이 공지사항을 수정할 권한이 없습니다'
      }, { status: 403 });
    }
    
    // 공지사항 수정
    const { data, error } = await supabase
      .from('teacher_announcements')
      .update({
        title,
        content,
        class_id: class_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('공지사항 수정 오류:', error);
      return NextResponse.json({ 
        error: '공지사항 수정 중 오류가 발생했습니다',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: '공지사항이 성공적으로 수정되었습니다' 
    });
    
  } catch (error: any) {
    console.error('API 예외 발생:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다' 
    }, { status: 500 });
  }
}

// 공지사항 삭제 API
export async function DELETE(request: Request) {
  try {
    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // 필수 필드 검증
    if (!id) {
      console.error('유효성 검사 실패: id 누락');
      return NextResponse.json({ 
        error: '공지사항 ID가 필요합니다' 
      }, { status: 400 });
    }
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('API 오류: Supabase 환경 변수가 설정되지 않음');
      return NextResponse.json({ 
        error: 'Supabase 환경 변수가 설정되지 않았습니다' 
      }, { status: 500 });
    }
    
    // Supabase 클라이언트 생성
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('인증 오류:', authError || '사용자 정보를 찾을 수 없음');
      return NextResponse.json({
        error: '인증에 실패했습니다',
        details: authError?.message
      }, { status: 401 });
    }
    
    // 교사 프로필 정보 확인
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (teacherError || !teacherData) {
      console.error('교사 권한 확인 오류:', teacherError || '교사 프로필이 없습니다');
      return NextResponse.json({
        error: '교사 권한이 없습니다',
        details: teacherError?.message
      }, { status: 403 });
    }
    
    // 삭제할 공지사항이 본인 것인지 확인
    const { data: announcementData, error: announcementError } = await supabase
      .from('teacher_announcements')
      .select('teacher_id')
      .eq('id', id)
      .single();
    
    if (announcementError) {
      console.error('공지사항 조회 오류:', announcementError);
      return NextResponse.json({ 
        error: '공지사항을 찾을 수 없습니다',
        details: announcementError.message
      }, { status: 404 });
    }
    
    if (announcementData.teacher_id !== teacherData.id) {
      console.error('권한 오류: 다른 교사의 공지사항 삭제 시도');
      return NextResponse.json({
        error: '이 공지사항을 삭제할 권한이 없습니다'
      }, { status: 403 });
    }
    
    // 공지사항 삭제
    const { error } = await supabase
      .from('teacher_announcements')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('공지사항 삭제 오류:', error);
      return NextResponse.json({ 
        error: '공지사항 삭제 중 오류가 발생했습니다',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '공지사항이 성공적으로 삭제되었습니다' 
    });
    
  } catch (error: any) {
    console.error('API 예외 발생:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다' 
    }, { status: 500 });
  }
} 