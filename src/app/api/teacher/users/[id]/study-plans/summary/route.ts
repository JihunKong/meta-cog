import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// Supabase 클라이언트 생성 - 런타임에만 초기화
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

interface Context {
  params: {
    id: string;
  };
}

// 학생 학습 계획 요약 정보 API (교사만 접근 가능)
export async function GET(request: Request, { params }: Context) {
  try {
    console.log("학생 학습 계획 요약 정보 API 호출됨");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("인증 실패: 세션 없음");
      throw new ApiError(401, "인증이 필요합니다");
    }

    console.log("인증된 사용자:", session.user.email, "역할:", session.user.role);

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      console.log("권한 오류: 교사 또는 관리자가 아님");
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    const { id } = params;
    console.log("조회할 학생 ID:", id);

    // Supabase 클라이언트 초기화
    const supabase = getSupabaseClient();

    // 사용자 확인
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', id)
      .single();

    if (userError) {
      console.error("Supabase 사용자 조회 오류:", userError);
      throw new ApiError(500, `데이터베이스 오류: ${userError.message}`);
    }

    if (!user) {
      console.log("사용자를 찾을 수 없음:", id);
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학생 학습 계획 조회
    const { data: studyPlans, error: plansError } = await supabase
      .from('StudyPlan')
      .select('id, target, achievement')
      .eq('user_id', id);

    if (plansError) {
      console.error("Supabase 학습 계획 조회 오류:", plansError);
      throw new ApiError(500, `데이터베이스 오류: ${plansError.message}`);
    }

    console.log(`조회된 학습 계획 수: ${studyPlans?.length || 0}`);

    // 학습 계획 통계 계산
    const totalPlans = studyPlans?.length || 0;
    
    // 달성률이 작성된(0보다 큰) 계획들만 필터링
    const plansWithAchievement = (studyPlans || []).filter((plan: any) => plan.achievement > 0);
    const completedPlans = plansWithAchievement.length;
    
    // 달성률 총합 계산
    const totalAchievement = plansWithAchievement.reduce((sum: number, plan: any) => {
      return sum + plan.achievement;
    }, 0);
    
    // 달성률이 작성된 계획만으로 평균 계산
    const averageAchievement = completedPlans > 0 ? totalAchievement / completedPlans : 0;

    console.log("요약 통계:", { totalPlans, completedPlans, averageAchievement });
    return successResponse({
      userId: id,
      totalPlans,
      completedPlans,
      averageAchievement,
    });
  } catch (error) {
    console.error("학생 학습 계획 요약 정보 API 오류:", error);
    return errorResponse(error as Error);
  }
} 