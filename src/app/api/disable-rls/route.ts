import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 서비스 역할 키로 관리자 클라이언트 생성
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('RLS 비활성화 API 초기화 - 환경 변수 확인:');
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
    // 주의: 이 API는 보안상 위험할 수 있으므로 개발 환경에서만 사용해야 합니다.
    // 실제 프로덕션 환경에서는 적절한 RLS 정책을 사용하는 것이 좋습니다.
    
    // smart_goals 테이블에 대한 RLS 비활성화
    const { error: disableSmartGoalsRlsError } = await supabaseAdmin.rpc(
      'alter_table_disable_rls',
      { table_name: 'smart_goals' }
    );
    
    if (disableSmartGoalsRlsError) {
      console.error('smart_goals 테이블 RLS 비활성화 오류:', disableSmartGoalsRlsError);
      
      // SQL 쿼리를 직접 실행하는 대체 방법
      const { error: sqlError } = await supabaseAdmin.rpc(
        'execute_sql',
        { sql: 'ALTER TABLE "public"."smart_goals" DISABLE ROW LEVEL SECURITY;' }
      );
      
      if (sqlError) {
        console.error('SQL 실행 오류:', sqlError);
        return NextResponse.json({ error: sqlError.message }, { status: 500 });
      }
    }
    
    // goal_progress 테이블에 대한 RLS 비활성화
    const { error: disableGoalProgressRlsError } = await supabaseAdmin.rpc(
      'alter_table_disable_rls',
      { table_name: 'goal_progress' }
    );
    
    if (disableGoalProgressRlsError) {
      console.error('goal_progress 테이블 RLS 비활성화 오류:', disableGoalProgressRlsError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS가 성공적으로 비활성화되었습니다. 보안상의 이유로 프로덕션 환경에서는 다시 활성화하는 것이 좋습니다.' 
    });
  } catch (error: any) {
    console.error('RLS 비활성화 API 예외 발생:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
