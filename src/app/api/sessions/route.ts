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
      // 다중 관계 오류 해결을 위해 조인 대신 직접 두 개의 쿼리 사용
      // 1. 먼저 smart_goals 데이터 가져오기
      const { data: goalData, error: goalError } = await supabaseAdmin
        .from('smart_goals')
        .select('id, subject, description, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (goalError) {
        console.error('목표 데이터 조회 오류:', {
          code: goalError.code,
          message: goalError.message,
          details: goalError.details,
          hint: goalError.hint
        });
        
        return NextResponse.json({ 
          error: goalError.message, 
          code: goalError.code,
          details: goalError.details,
          hint: goalError.hint
        }, { status: 500 });
      }

      // 목표 데이터가 없으면 빈 배열 반환
      if (!goalData || goalData.length === 0) {
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }

      // 2. 목표 ID 목록 추출
      const goalIds = goalData.map(goal => goal.id);

      // 3. 관련된 progress 데이터 가져오기
      const { data: progressData, error: progressError } = await supabaseAdmin
        .from('goal_progress')
        .select('id, smart_goal_id, percent, reflection, created_at')
        .in('smart_goal_id', goalIds);

      if (progressError) {
        console.error('진행 데이터 조회 오류:', {
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

      // 4. 결과 데이터 구성 (클라이언트가 기대하는 형식으로)
      const resultData = goalData.map(goal => {
        const goalProgress = progressData
          .filter(progress => progress.smart_goal_id === goal.id)
          .map(progress => ({
            id: progress.id,
            percent: progress.percent,
            reflection: progress.reflection,
            created_at: progress.created_at
          }));

        return {
          ...goal,
          goal_progress: goalProgress
        };
      });

      console.log('세션 데이터 조회 성공:', { count: resultData.length || 0 });
      
      return NextResponse.json({ 
        success: true, 
        data: resultData 
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
