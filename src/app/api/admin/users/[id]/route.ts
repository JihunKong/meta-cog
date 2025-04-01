import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    const id = params.id;
    
    // 사용자 정보 조회
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학습 계획 조회
    const { data: studyPlans, error: studyPlansError } = await supabase
      .from('StudyPlan')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (studyPlansError) {
      console.error("학습 계획 조회 중 오류:", studyPlansError);
    }

    return successResponse({
      ...user,
      studyPlans: studyPlans || []
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    const id = params.id;
    
    // 관리자는 자기 자신을 삭제할 수 없음
    if (id === session.user.id) {
      throw new ApiError(400, "자기 자신을 삭제할 수 없습니다");
    }
    
    // 1. CurriculumProgress 삭제
    const { error: progressError } = await supabase
      .from('CurriculumProgress')
      .delete()
      .eq('user_id', id);

    if (progressError) {
      console.error("CurriculumProgress 삭제 중 오류:", progressError);
    }
    
    // 2. AIRecommendation 삭제
    const { error: recommendationError } = await supabase
      .from('AIRecommendation')
      .delete()
      .eq('user_id', id);

    if (recommendationError) {
      console.error("AIRecommendation 삭제 중 오류:", recommendationError);
    }
    
    // 3. StudyPlan 삭제
    const { error: studyPlanError } = await supabase
      .from('StudyPlan')
      .delete()
      .eq('user_id', id);

    if (studyPlanError) {
      console.error("StudyPlan 삭제 중 오류:", studyPlanError);
    }
    
    // 4. User 테이블에서 사용자 삭제
    const { error: userError } = await supabase
      .from('User')
      .delete()
      .eq('id', id);

    if (userError) {
      throw new ApiError(500, "사용자 삭제 중 오류가 발생했습니다: " + userError.message);
    }
    
    // 5. Supabase Auth에서 사용자 삭제
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error("Auth 사용자 삭제 중 오류:", authError);
      throw new ApiError(500, "인증 정보 삭제 중 오류가 발생했습니다");
    }

    return successResponse({ message: "사용자가 성공적으로 삭제되었습니다" });
  } catch (error) {
    return errorResponse(error as Error);
  }
} 