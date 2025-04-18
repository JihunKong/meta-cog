import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// 이 함수는 서버에서 동적으로 실행되어야 함을 명시
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 요청 데이터 파싱
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('요청 데이터 파싱 오류:', parseError);
      return NextResponse.json({ 
        error: '유효하지 않은 요청 형식입니다.' 
      }, { status: 400 });
    }
    
    const { user_id, subject, description } = requestData;
    
    // 필수 필드 검증
    if (!user_id) {
      console.error('유효성 검사 실패: user_id 누락');
      return NextResponse.json({ 
        error: 'user_id가 필요합니다.' 
      }, { status: 400 });
    }
    
    if (!subject || !description) {
      console.error('유효성 검사 실패: 필수 필드 누락', { subject: !!subject, description: !!description });
      return NextResponse.json({ 
        error: 'subject와 description이 필요합니다.' 
      }, { status: 400 });
    }
    
    console.log('API 요청 데이터:', { user_id, subject, description });
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
    
    // 데이터베이스 작업
    try {
      // RLS 우회를 위해 supabaseAdmin 클라이언트 사용
      const { data, error } = await supabaseAdmin
        .from('smart_goals')
        .insert([{ 
          user_id, 
          subject, 
          description 
        }])
        .select();
        
      if (error) {
        console.error('목표 생성 API 오류:', {
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
      
      console.log('목표 생성 성공:', data);
      
      if (data && data.length > 0) {
        const goalId = data[0].id;
        
        // goal_progress에 데이터 삽입 (여기도 RLS 우회)
        const { error: progressError } = await supabaseAdmin
          .from('goal_progress')
          .insert({ 
            smart_goal_id: goalId, 
            percent: 0, 
            reflection: '' 
          });
          
        if (progressError) {
          console.error('진행상황 추가 API 오류:', {
            code: progressError.code,
            message: progressError.message,
            details: progressError.details,
            hint: progressError.hint
          });
          
          return NextResponse.json({ 
            error: progressError.message, 
            code: progressError.code,
            details: progressError.details,
            hint: progressError.hint
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          data,
          message: '목표 및 진행상황이 성공적으로 생성되었습니다.' 
        });
      }
      
      return NextResponse.json({ 
        error: '목표 생성 실패' 
      }, { status: 500 });
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
    console.error('API 예외 발생:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
