import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export async function POST(request: Request) {
  try {
    const { user_id, subject, description } = await request.json();
    
    console.log('API 요청 데이터:', { user_id, subject, description });
    
    // 서비스 역할로 데이터 삽입 (RLS 우회)
    // 타입 변환 없이 원래 user_id 사용
    console.log('삽입할 데이터:', { 
      user_id, 
      subject, 
      description 
    });
    
    const { data, error } = await supabase
      .from('smart_goals')
      .insert([{ 
        user_id, 
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
      const { error: progressError } = await supabase
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
