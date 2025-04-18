import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// 이 함수는 서버에서 동적으로 실행되어야 함을 명시
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // URL에서 사용자 ID 파라미터 추출
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.error('API 오류: 사용자 ID가 제공되지 않음');
      return NextResponse.json({ 
        error: '사용자 ID가 필요합니다' 
      }, { status: 400 });
    }
    
    console.log('세션 데이터 요청:', { userId });
    console.log('인스턴스 정보:', { 
      isAdminClient: !!supabaseAdmin,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    // 요청 전 추가 디버깅 정보
    try {
      console.log('요청 URL 정보:', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries([...new Headers(request.headers).entries()].filter(
          ([key]) => !['cookie', 'authorization'].includes(key.toLowerCase())
        ))
      });
      
      console.log('환경 변수 상태:', {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락됨',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '누락됨',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '누락됨'
      });
    } catch (logError) {
      console.error('로깅 중 오류:', logError);
    }
    
    // RLS 우회를 위해 supabaseAdmin 클라이언트 사용
    try {
      const { data, error } = await supabaseAdmin
        .from('smart_goals')
        .select(`
          id, 
          subject, 
          description, 
          created_at, 
          user_id,
          goal_progress!smart_goal_id(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('세션 데이터 조회 오류:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        return NextResponse.json({ 
          error: error.message, 
          code: error.code,
          details: error.details,
          hint: error.hint
        }, { status: 500 });
      }
      
      console.log('세션 데이터 조회 성공:', { count: data?.length || 0 });
      
      return NextResponse.json({ 
        success: true, 
        data 
      });
    } catch (dbError: any) {
      console.error('DB 쿼리 실행 중 예외 발생:', {
        message: dbError.message,
        stack: dbError.stack
      });
      
      return NextResponse.json({ 
        error: '데이터베이스 쿼리 실행 중 오류 발생',
        message: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('세션 API 예외 발생:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
