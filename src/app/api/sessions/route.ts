import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 서버 측에서 직접 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 관리자 클라이언트 직접 생성 (라이브러리 import 없이)
const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

// 이 함수는 서버에서 동적으로 실행되어야 함을 명시
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // URL에서 사용자 ID 파라미터 추출
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        error: '사용자 ID가 필요합니다' 
      }, { status: 400 });
    }
    
    console.log('세션 데이터 요청:', { userId });
    console.log('서버 환경변수 상태:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0
    });
    
    // RLS 우회를 위해 supabaseAdmin 클라이언트 사용
    const { data, error } = await supabaseAdmin
      .from('smart_goals')
      .select('id, user_id, subject, description, created_at, goal_progress(id, percent, reflection, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('세션 데이터 조회 오류:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    
    console.log('세션 데이터 조회 성공:', { count: data?.length || 0 });
    
    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error: any) {
    console.error('세션 API 예외 발생:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.',
      stack: error.stack 
    }, { status: 500 });
  }
}
