import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

// 데이터 인터페이스 정의
interface SmartGoal {
  id?: string;
  subject: string;
  description: string;
  user_id: string;
}

interface GoalProgress {
  smart_goal_id: string;
  percent: number;
  reflection: string;
}

// 이 함수는 서버에서 동적으로 실행되어야 함을 명시
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 요청 로깅
    console.log('목표 생성 API 호출:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries([...new Headers(request.headers).entries()].filter(
        ([key]) => !['cookie', 'authorization'].includes(key.toLowerCase())
      ))
    });

    // 요청 본문에서 데이터 파싱
    let requestData;
    try {
      requestData = await request.json();
      console.log('요청 데이터:', { ...requestData, user_id: requestData.user_id ? '설정됨' : '누락됨' });
    } catch (error) {
      console.error('JSON 파싱 오류:', error);
      return NextResponse.json({ error: '유효한 JSON 데이터가 필요합니다' }, { status: 400 });
    }

    // 필수 필드 유효성 검사
    const { user_id, subject, description } = requestData;
    if (!user_id || !subject || !description) {
      const missingFields = [];
      if (!user_id) missingFields.push('user_id');
      if (!subject) missingFields.push('subject');
      if (!description) missingFields.push('description');
      
      console.error('필수 필드 누락:', { missingFields });
      return NextResponse.json({ 
        error: '필수 필드가 누락되었습니다', 
        missingFields 
      }, { status: 400 });
    }

    // 토큰 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('API 오류: Supabase 환경 변수가 설정되지 않음');
      return NextResponse.json({ 
        error: 'Supabase 환경 변수가 설정되지 않았습니다' 
      }, { status: 500 });
    }
    
    console.log('Supabase 인스턴스 정보:', { 
      hasAuthToken: !!token,
      supabaseUrl: supabaseUrl ? '설정됨' : '누락됨',
      supabaseAnonKey: supabaseAnonKey ? '설정됨' : '누락됨'
    });

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
    let user;
    let authError;
    
    if (token) {
      // 토큰 기반 인증
      const authResponse = await supabase.auth.getUser(token);
      user = authResponse.data.user;
      authError = authResponse.error;
    } else {
      // 쿠키 기반 인증
      const authResponse = await supabase.auth.getUser();
      user = authResponse.data.user;
      authError = authResponse.error;
    }

    if (authError || !user) {
      console.error('인증 오류:', authError || '사용자 정보를 찾을 수 없음');
      return NextResponse.json({
        error: '인증에 실패했습니다',
        details: authError?.message
      }, { status: 401 });
    }

    // 요청한 user_id와 인증된 사용자 ID 일치 여부 확인
    if (user.id !== user_id) {
      console.error('권한 오류: 요청 사용자 ID와 인증된 사용자 ID 불일치', { 
        requestedId: user_id, 
        authenticatedId: user.id 
      });
      return NextResponse.json({
        error: '이 작업을 수행할 권한이 없습니다'
      }, { status: 403 });
    }

    try {
      // 1. smart_goals 테이블에 목표 추가
      const goal: SmartGoal = {
        user_id,
        subject,
        description
      };

      const { data: goalData, error: goalError } = await supabase
        .from('smart_goals')
        .insert(goal)
        .select('id')
        .single();

      if (goalError) {
        console.error('목표 추가 오류:', {
          code: goalError.code,
          message: goalError.message,
          details: goalError.details,
          hint: goalError.hint
        });
        
        return NextResponse.json({ 
          error: goalError.message,
          code: goalError.code,
          details: goalError.details
        }, { status: 500 });
      }

      // 2. goal_progress 테이블에 초기 진행 상태 추가 (0%)
      const progress: GoalProgress = {
        smart_goal_id: goalData.id,
        percent: 0,
        reflection: '목표가 설정되었습니다.'
      };

      const { data: progressData, error: progressError } = await supabase
        .from('goal_progress')
        .insert(progress)
        .select();

      if (progressError) {
        console.error('진행 상태 추가 오류:', {
          code: progressError.code,
          message: progressError.message,
          details: progressError.details,
          hint: progressError.hint
        });
        
        // 목표는 이미 추가되었으므로 사용자에게 알립니다
        return NextResponse.json({ 
          error: progressError.message,
          code: progressError.code,
          details: progressError.details,
          partialSuccess: true,
          goalId: goalData.id
        }, { status: 500 });
      }

      console.log('목표 생성 성공:', {
        goalId: goalData.id,
        progressId: progressData?.[0]?.id
      });

      // 성공 응답
      return NextResponse.json({ 
        success: true, 
        data: {
          goal: { id: goalData.id, ...goal },
          progress: progressData?.[0]
        }
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
    console.error('목표 API 예외 발생:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
