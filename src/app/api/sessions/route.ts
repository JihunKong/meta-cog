import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 데이터 인터페이스 정의
interface SmartGoal {
  id: string;
  subject: string;
  description: string;
  created_at: string;
  user_id: string;
}

interface GoalProgress {
  id: string;
  smart_goal_id: string;
  percent: number;
  reflection: string;
  created_at: string;
}

interface SessionData extends SmartGoal {
  goal_progress: Array<{
    id: string;
    percent: number;
    reflection: string;
    created_at: string;
  }>;
}

// 이 함수는 서버에서 동적으로 실행되어야 함을 명시
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 요청 로깅
    console.log('세션 API 호출:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries([...new Headers(request.headers).entries()].filter(
        ([key]) => !['cookie', 'authorization'].includes(key.toLowerCase())
      ))
    });

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('API 오류: Supabase 환경 변수가 설정되지 않음', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      });
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

    try {
      // 사용자 세션 데이터 조회 - 명시적 조인 관계 사용
      const { data, error } = await supabase
        .from('smart_goals')
        .select(`
          id,
          subject,
          description,
          goal_progress (
            id,
            percent,
            reflection,
            created_at,
            updated_at
          ),
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
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
          details: error.details
        }, { status: 500 });
      }

      // 사용자 이름 조회
      const { data: userData, error: userError } = await supabase
        .from('student_names')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('사용자 이름 조회 오류:', {
          code: userError.code,
          message: userError.message,
          details: userError.details
        });
      }

      const userName = userData?.display_name || user.email || user.id;

      return NextResponse.json({
        sessions: data || [],
        user: {
          id: user.id,
          email: user.email,
          name: userName
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
