import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

interface Context {
  params: {
    id: string;
  };
}

// 학생 학습 계획 요약 정보 API (교사만 접근 가능)
export async function GET(request: Request, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    const { id } = params;

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true,
        role: true 
      }
    });

    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학생 학습 계획 조회
    const studyPlans = await prisma.studyPlan.findMany({
      where: { userId: id },
      select: {
        id: true,
        target: true,
        achievement: true,
      },
    });

    // 학습 계획 통계 계산
    const totalPlans = studyPlans.length;
    
    // 달성률이 작성된(0보다 큰) 계획들만 필터링
    const plansWithAchievement = studyPlans.filter(plan => plan.achievement > 0);
    const completedPlans = plansWithAchievement.length;
    
    // 달성률 총합 계산
    const totalAchievement = plansWithAchievement.reduce((sum, plan) => {
      return sum + plan.achievement;
    }, 0);
    
    // 달성률이 작성된 계획만으로 평균 계산
    const averageAchievement = completedPlans > 0 ? totalAchievement / completedPlans : 0;

    return successResponse({
      userId: id,
      totalPlans,
      completedPlans,
      averageAchievement,
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
} 