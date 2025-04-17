import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 서비스 역할 키로 관리자 클라이언트 생성
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('RLS 설정 API 초기화 - 환경 변수 확인:');
console.log('URL 존재 여부:', !!supabaseUrl);
console.log('Service Role Key 존재 여부:', !!serviceRoleKey);

const supabaseAdmin = createClient(
  supabaseUrl!,
  serviceRoleKey!
);

export async function GET(request: Request) {
  try {
    // 현재 RLS 정책 확인
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc('get_policies');
    
    if (policiesError) {
      console.error('RLS 정책 조회 오류:', policiesError);
      return NextResponse.json({ error: policiesError.message }, { status: 500 });
    }
    
    // smart_goals 테이블에 대한 RLS 정책 설정
    // 기존 정책 삭제
    await supabaseAdmin.rpc('drop_policy_if_exists', {
      table_name: 'smart_goals',
      policy_name: 'Users can only access their own goals'
    });
    
    // 새 정책 생성 - 타입 변환을 사용하여 비교
    const { error: createPolicyError } = await supabaseAdmin.rpc('create_policy', {
      table_name: 'smart_goals',
      policy_name: 'Users can only access their own goals',
      policy_definition: "auth.uid()::text = user_id::text",
      policy_operation: 'ALL',
      policy_check: 'true'
    });
    
    if (createPolicyError) {
      console.error('RLS 정책 생성 오류:', createPolicyError);
      return NextResponse.json({ error: createPolicyError.message }, { status: 500 });
    }
    
    // 정책 생성 후 확인
    const { data: updatedPolicies, error: updatedPoliciesError } = await supabaseAdmin.rpc('get_policies');
    
    if (updatedPoliciesError) {
      console.error('업데이트된 RLS 정책 조회 오류:', updatedPoliciesError);
      return NextResponse.json({ error: updatedPoliciesError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS 정책이 성공적으로 설정되었습니다.',
      originalPolicies: policies,
      updatedPolicies: updatedPolicies
    });
  } catch (error: any) {
    console.error('RLS 설정 API 예외 발생:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
