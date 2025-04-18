import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// 이 함수는 서버에서 동적으로 실행되어야 함을 명시
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { user_id, subject, description } = await request.json();
    
    console.log('API 요청 데이터:', { user_id, subject, description });
    console.log('user_id 타입:', typeof user_id);
    console.log('user_id 값:', user_id);
    
    console.log('삽입할 데이터:', { 
      user_id, 
      subject, 
      description 
    });

    console.log('권한 문제 진단: 현재 수행하려는 작업 - smart_goals 테이블에 데이터 삽입');
    console.log('테이블의 RLS 정책을 확인해주세요. 모든 사용자에게 삽입 권한이 있어야 합니다.');
    
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
      // 자세한 오류 정보 제공
      console.error('오류 상세:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
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
        // 자세한 오류 정보 제공
        console.error('오류 상세:', {
          code: progressError.code,
          details: progressError.details,
          hint: progressError.hint,
          message: progressError.message
        });
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
