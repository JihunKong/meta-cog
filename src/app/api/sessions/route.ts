import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 서비스 역할 키로 관리자 클라이언트 생성
// Netlify 환경 변수에서 가져옴
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('세션 API 라우트 초기화 - 환경 변수 확인:');
console.log('URL:', supabaseUrl);
console.log('Service Role Key 존재 여부:', !!serviceRoleKey);

// 안전한 로깅을 위해 키의 일부만 출력
if (serviceRoleKey) {
  console.log('Service Role Key 시작 부분:', serviceRoleKey.substring(0, 10) + '...');
}

// 서비스 역할 키가 없을 경우 기본 클라이언트 사용 (개발 환경용)
const supabaseAdmin = createClient(
  supabaseUrl || 'https://ljrrinokzegzjbovssjy.supabase.co',
  serviceRoleKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjExODgxNCwiZXhwIjoyMDU3Njk0ODE0fQ.dT1-dsN3MUeigfKRaK97UBg_pV7Cx88rh_dnwxlHiLY'
);

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
    // user_id를 UUID 형식으로 사용 (테이블 정의에 맞게)
    console.log('세션 조회 매개변수:', { userId });
    
    // 정확한 테이블 구조에 맞게 조회
    // goal_progress는 smart_goal_id를 통해 연결
    const { data, error } = await supabaseAdmin
      .from('smart_goals')
      .select('id, user_id, subject, description, created_at, goal_progress(id, percent, reflection, created_at)')
      .eq('user_id', userId) // UUID 형식으로 그대로 사용
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
