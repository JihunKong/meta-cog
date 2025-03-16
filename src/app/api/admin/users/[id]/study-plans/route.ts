import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자나 교사 권한 확인
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      throw new ApiError(403, "권한이 없습니다");
    }

    const id = params.id;
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학습 계획 가져오기
    const studyPlans = await prisma.studyPlan.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        content: true,
        target: true,
        achievement: true,
        date: true,
        timeSlot: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return successResponse(studyPlans);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 