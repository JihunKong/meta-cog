import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 서비스 역할 키로 관리자 클라이언트 생성
// Netlify 환경 변수에서 가져옴
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('API 라우트 초기화 - 환경 변수 확인:');
console.log('URL 존재 여부:', !!supabaseUrl);
console.log('Service Role Key 존재 여부:', !!serviceRoleKey);

const supabaseAdmin = createClient(
  supabaseUrl!,
  serviceRoleKey!
);

export async function POST(request: Request) {
  try {
    const { user_id, subject, description } = await request.json();
    
    console.log('API 요청 데이터:', { user_id, subject, description });
    
    // 서비스 역할로 데이터 삽입 (RLS 우회)
    // user_id를 문자열로 변환하여 저장 (타입 불일치 문제 해결)
    const { data, error } = await supabaseAdmin
      .from('smart_goals')
      .insert([{ 
        user_id: user_id.toString(), 
        subject, 
        description 
      }])
      .select();
      
    if (error) {
      console.error('목표 생성 API 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('목표 생성 성공:', data);
    
    if (data && data.length > 0) {
      const goalId = data[0].id;
      
      // goal_progress에 데이터 삽입
      const { error: progressError } = await supabaseAdmin
        .from('goal_progress')
        .insert({ 
          smart_goal_id: goalId, 
          percent: 0, 
          reflection: '' 
        });
        
      if (progressError) {
        console.error('진행상황 추가 API 오류:', progressError);
        return NextResponse.json({ error: progressError.message }, { status: 500 });
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
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
