import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

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
    
    // 서비스 역할로 데이터 조회 (RLS 우회)
    // user_id를 문자열로 변환하여 비교 (RLS 정책에 맞게)
    console.log('세션 조회 매개변수:', { userId: userId.toString() });
    
    // 정확한 테이블 구조에 맞게 조회
    // goal_progress는 smart_goal_id를 통해 연결
    const { data, error } = await supabase
      .from('smart_goals')
      .select('id, user_id, subject, description, created_at, goal_progress(id, percent, reflection, created_at)')
      .eq('user_id', userId.toString()) // 문자열로 변환하여 사용
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('세션 데이터 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('세션 데이터 조회 성공:', { count: data?.length || 0 });
    
    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error: any) {
    console.error('세션 API 예외 발생:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
