import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 서비스 역할 키로 관리자 클라이언트 생성
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('테스트 API 초기화 - 환경 변수 확인:');
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
    // 테이블 구조 확인
    console.log('테이블 구조 확인 중...');
    
    // smart_goals 테이블 구조 확인
    const { data: tableInfo, error: tableInfoError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'smart_goals');
    
    if (tableInfoError) {
      console.error('테이블 구조 확인 오류:', tableInfoError);
    } else {
      console.log('테이블 구조:', tableInfo);
    }
    
    // 테스트 데이터 삽입
    console.log('테스트 데이터 삽입 중...');
    
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // 테스트용 UUID
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('smart_goals')
      .insert([{
        user_id: testUserId,
        subject: '서비스 역할 테스트',
        description: '서비스 역할 키 테스트를 위한 데이터'
      }])
      .select();
    
    if (insertError) {
      console.error('데이터 삽입 오류:', insertError);
      return NextResponse.json({
        success: false,
        error: insertError.message,
        details: {
          code: insertError.code,
          hint: insertError.hint,
          details: insertError.details
        }
      }, { status: 500 });
    }
    
    console.log('데이터 삽입 성공:', insertData);
    
    // 삽입된 데이터 조회
    const { data: selectData, error: selectError } = await supabaseAdmin
      .from('smart_goals')
      .select('*')
      .eq('user_id', testUserId);
    
    if (selectError) {
      console.error('데이터 조회 오류:', selectError);
    } else {
      console.log('조회된 데이터:', selectData);
    }
    
    return NextResponse.json({
      success: true,
      message: '테스트 완료',
      insertResult: insertData,
      selectResult: selectData
    });
  } catch (error: any) {
    console.error('테스트 API 예외 발생:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
