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

// 학생 학습 계획 조회 API (교사만 접근 가능)
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

    // 학생만 조회 가능
    if (user.role !== "STUDENT") {
      throw new ApiError(400, "학생의 학습 계획만 조회할 수 있습니다");
    }

    // URL에서 날짜 범위 파라미터 추출
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // 학생 학습 계획 조회
    const studyPlans = await prisma.studyPlan.findMany({
      where: {
        user_id: id,
        ...(startDate && endDate ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        } : {})
      },
      orderBy: {
        date: 'desc',
      },
    });

    return successResponse(studyPlans);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 