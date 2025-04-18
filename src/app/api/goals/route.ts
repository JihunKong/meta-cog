import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    // 요청 헤더에서 인증 토큰 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      console.error('API 오류: 인증 토큰이 제공되지 않음');
      return NextResponse.json({ 
        error: '인증 토큰이 필요합니다' 
      }, { status: 401 });
    }
    
    // 클라이언트 생성 및 토큰 설정
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    console.log('API 요청 데이터:', { user_id, subject, description });
    console.log('인스턴스 정보:', { 
      hasAuthToken: !!token,
      supabaseUrl: supabaseUrl ? '설정됨' : '누락됨',
      supabaseAnonKey: supabaseAnonKey ? '설정됨' : '누락됨'
    });
    
    // 요청 전 추가 디버깅 정보
    try {
      console.log('요청 URL 정보:', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries([...new Headers(request.headers).entries()].filter(
          ([key]) => !['cookie'].includes(key.toLowerCase())
        ))
      });
      
      console.log('인증 토큰:', token?.substring(0, 10) + '...');
      
      console.log('환경 변수 상태:', {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락됨',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '누락됨'
      });
    } catch (logError) {
      console.error('로깅 중 오류:', logError);
    }
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('인증 오류:', authError || '사용자 정보를 찾을 수 없음');
      return NextResponse.json({
        error: '인증에 실패했습니다',
        details: authError?.message
      }, { status: 401 });
    }
    
    // 요청한 userId와 인증된 userId 일치 여부 확인
    if (user.id !== user_id) {
      console.error('권한 오류: 요청 사용자 ID와 인증된 사용자 ID 불일치', { 
        requestedId: user_id, 
        authenticatedId: user.id 
      });
      return NextResponse.json({
        error: '이 데이터에 접근할 권한이 없습니다'
      }, { status: 403 });
    }
    
    try {
      // 인증된 사용자로 smart_goals 테이블에 데이터 삽입
      const { data, error } = await supabase
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
        
        // 동일한 인증 컨텍스트에서 goal_progress에 데이터 삽입
        const { error: progressError } = await supabase
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
