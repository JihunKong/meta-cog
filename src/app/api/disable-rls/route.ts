// (삭제됨) 서비스 역할 키 테스트 및 RLS 비활성화용 라우트는 더 이상 사용하지 않습니다.
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
    
    // 오류 로그를 확인하기 위한 테스트 쿼리 실행
    console.log('테스트 쿼리 실행 중...');
    
    // smart_goals 테이블에서 데이터 조회 시도
    const { data: smartGoalsData, error: smartGoalsError } = await supabaseAdmin
      .from('smart_goals')
      .select('*')
      .limit(1);
    
    if (smartGoalsError) {
      console.error('smart_goals 테이블 조회 오류:', smartGoalsError);
    } else {
      console.log('smart_goals 테이블 조회 성공:', { count: smartGoalsData?.length || 0 });
    }
    
    // 새 데이터 삽입 시도
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('smart_goals')
      .insert([{
        user_id: '00000000-0000-0000-0000-000000000000', // 더미 ID
        subject: 'RLS 테스트',
        description: 'RLS 비활성화 테스트를 위한 더미 데이터'
      }])
      .select();
    
    if (insertError) {
      console.error('데이터 삽입 오류:', insertError);
    } else {
      console.log('데이터 삽입 성공:', insertData);
    }
    
    // 오류 메시지 분석
    const errorMessage = smartGoalsError?.message || insertError?.message || '';
    const isPermissionDenied = errorMessage.includes('permission denied');
    
    if (isPermissionDenied) {
      return NextResponse.json({ 
        success: false, 
        message: 'RLS 정책이 활성화되어 있어 접근이 거부되었습니다. Supabase 대시보드에서 RLS를 비활성화하거나 적절한 정책을 설정해야 합니다.',
        error: errorMessage,
        solution: `1. Supabase 대시보드에서 smart_goals 테이블의 RLS를 비활성화하세요: ALTER TABLE "public"."smart_goals" DISABLE ROW LEVEL SECURITY;
2. 또는 적절한 RLS 정책을 설정하세요: CREATE POLICY "Users can only access their own goals" ON "public"."smart_goals" FOR ALL USING (auth.uid()::text = user_id::text);`
      }, { status: 403 });
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
