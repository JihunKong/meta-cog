import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// 관리자 통계 데이터 API
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    // 총 사용자 수 (관리자 제외)
    const totalUsers = await prisma.user.count({
      where: {
        role: "STUDENT",
      },
    });

    // 과목 수
    const subjects = await prisma.curriculum.findMany({
      select: {
        subject: true,
      },
      distinct: ['subject'],
    });
    const totalSubjects = subjects.length;

    // 교과서 단원 수
    const totalCurriculums = await prisma.curriculum.count();

    // 학습 계획 수
    const totalStudyPlans = await prisma.studyPlan.count();

    // 완료된 학습 계획 수 (달성률 100% 이상)
    const completedStudyPlans = await prisma.studyPlan.count({
      where: {
        achievement: {
          gte: 100,
        },
      },
    });

    const stats = {
      totalUsers,
      totalSubjects,
      totalCurriculums,
      totalStudyPlans,
      completedStudyPlans,
    };

    return successResponse(stats);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 