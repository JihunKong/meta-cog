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

export async function POST(request: Request) {
  try {
    const { user_id, subject, description } = await request.json();
    
    console.log('API 요청 데이터:', { user_id, subject, description });
    console.log('서버 환경변수 상태:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0
    });
    
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
      console.error('목표 생성 API 오류:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
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
        console.error('진행상황 추가 API 오류:', progressError);
        return NextResponse.json({ error: progressError.message, details: progressError }, { status: 500 });
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
  } catch (error: any) {
    console.error('API 예외 발생:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.',
      stack: error.stack
    }, { status: 500 });
  }
}
