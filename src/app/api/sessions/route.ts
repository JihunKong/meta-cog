import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

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
    console.log('권한 문제 진단: 현재 수행하려는 작업 - smart_goals 테이블에서 데이터 조회');
    console.log('테이블의 RLS 정책을 확인해주세요. 사용자가 자신의 데이터를 조회할 수 있어야 합니다.');
    
    // 정확한 테이블 구조에 맞게 조회
    // goal_progress는 smart_goal_id를 통해 연결
    console.log('Supabase 요청 전송 전 환경:', {
      hasUrl: !!supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey,
      url: supabase.supabaseUrl,
      userId: userId,
      userIdType: typeof userId
    });
    
    const { data, error } = await supabase
      .from('smart_goals')
      .select('id, user_id, subject, description, created_at, goal_progress(id, percent, reflection, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('세션 데이터 조회 오류:', error);
      // 자세한 오류 정보 제공
      console.error('오류 상세:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
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
