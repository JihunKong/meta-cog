import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 서비스 역할 키로 관리자 클라이언트 생성
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('스키마 확인 API 초기화 - 환경 변수 확인:');
console.log('URL 존재 여부:', !!supabaseUrl);
console.log('Service Role Key 존재 여부:', !!serviceRoleKey);

const supabaseAdmin = createClient(
  supabaseUrl!,
  serviceRoleKey!
);

export async function GET(request: Request) {
  try {
    // smart_goals 테이블 스키마 확인
    const { data: smartGoalsSchema, error: smartGoalsError } = await supabaseAdmin.rpc(
      'get_table_definition',
      { table_name: 'smart_goals' }
    );
    
    if (smartGoalsError) {
      console.error('smart_goals 테이블 스키마 조회 오류:', smartGoalsError);
      
      // 대체 방법으로 테이블 정보 조회
      const { data: tableInfo, error: tableInfoError } = await supabaseAdmin
        .from('smart_goals')
        .select('*')
        .limit(1);
        
      if (tableInfoError) {
        console.error('테이블 정보 조회 오류:', tableInfoError);
        return NextResponse.json({ error: tableInfoError.message }, { status: 500 });
      }
      
      // 테이블 컬럼 정보 추출
      const columns = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [];
      
      return NextResponse.json({
        success: true,
        message: 'smart_goals 테이블 컬럼 정보',
        columns
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      schema: smartGoalsSchema
    });
  } catch (error: any) {
    console.error('스키마 확인 API 예외 발생:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
