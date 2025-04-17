// (삭제됨) DB 스키마 확인용 라우트는 더 이상 사용하지 않습니다.
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
    // 테이블 목록 조회
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (tablesError) {
      console.error('테이블 목록 조회 오류:', tablesError);
      return NextResponse.json({ error: tablesError.message }, { status: 500 });
    }
    
    // smart_goals 테이블 스키마 조회
    const { data: smartGoalsInfo, error: smartGoalsError } = await supabaseAdmin
      .from('smart_goals')
      .select('*')
      .limit(1);
      
    if (smartGoalsError) {
      console.error('smart_goals 테이블 조회 오류:', smartGoalsError);
      return NextResponse.json({ error: smartGoalsError.message }, { status: 500 });
    }
    
    // goal_progress 테이블 스키마 조회
    const { data: goalProgressInfo, error: goalProgressError } = await supabaseAdmin
      .from('goal_progress')
      .select('*')
      .limit(1);
      
    if (goalProgressError) {
      console.error('goal_progress 테이블 조회 오류:', goalProgressError);
    }
    
    // profiles 테이블 스키마 조회
    const { data: profilesInfo, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profilesError) {
      console.error('profiles 테이블 조회 오류:', profilesError);
    }
    
    // 테이블 컴럼 정보 추출
    const smartGoalsColumns = smartGoalsInfo && smartGoalsInfo.length > 0 ? Object.keys(smartGoalsInfo[0]) : [];
    const goalProgressColumns = goalProgressInfo && goalProgressInfo.length > 0 ? Object.keys(goalProgressInfo[0]) : [];
    const profilesColumns = profilesInfo && profilesInfo.length > 0 ? Object.keys(profilesInfo[0]) : [];
    
    // 전체 데이터베이스 정보 반환
    return NextResponse.json({
      success: true,
      tables: tables?.map(t => t.tablename) || [],
      schemas: {
        smart_goals: {
          columns: smartGoalsColumns,
          sample: smartGoalsInfo?.[0] || null
        },
        goal_progress: {
          columns: goalProgressColumns,
          sample: goalProgressInfo?.[0] || null
        },
        profiles: {
          columns: profilesColumns,
          sample: profilesInfo?.[0] || null
        }
      }
    });
  } catch (error: any) {
    console.error('스키마 확인 API 예외 발생:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
