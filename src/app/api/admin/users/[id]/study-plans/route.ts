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
      where: { user_id: id },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        subject: true,
        content: true,
        target: true,
        achievement: true,
        date: true,
        time_slot: true,
        reflection: true,
        user_id: true,
        created_at: true,
        updated_at: true
      }
    });

    // Prisma 스타일 응답으로 변환 (클라이언트 호환성)
    const formattedStudyPlans = studyPlans.map((plan: {
      id: string;
      subject: string;
      content: string;
      target: number;
      achievement: number;
      date: Date;
      time_slot: string;
      reflection: string | null;
      user_id: string;
      created_at: Date;
      updated_at: Date;
    }) => ({
      id: plan.id,
      subject: plan.subject,
      content: plan.content,
      target: plan.target,
      achievement: plan.achievement, 
      date: plan.date,
      timeSlot: plan.time_slot,
      reflection: plan.reflection,
      userId: plan.user_id,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    }));

    return successResponse(formattedStudyPlans);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 