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

// 특정 AI 추천 조회
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    const recommendation = await prisma.aIRecommendation.findUnique({
      where: {
        id,
      },
    });

    if (!recommendation) {
      throw new ApiError(404, "추천을 찾을 수 없습니다");
    }

    // 자신의 추천만 볼 수 있음
    if (recommendation.userId !== session.user.id) {
      throw new ApiError(403, "이 추천에 접근할 권한이 없습니다");
    }

    return successResponse(recommendation);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// AI 추천 삭제
export async function DELETE(request: Request, { params }: Context) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 추천 존재 확인
    const recommendation = await prisma.aIRecommendation.findUnique({
      where: {
        id,
      },
    });

    if (!recommendation) {
      throw new ApiError(404, "추천을 찾을 수 없습니다");
    }

    // 자신의 추천만 삭제 가능
    if (recommendation.userId !== session.user.id) {
      throw new ApiError(403, "이 추천을 삭제할 권한이 없습니다");
    }

    // 추천 삭제
    await prisma.aIRecommendation.delete({
      where: {
        id,
      },
    });

    return successResponse({ message: "추천이 삭제되었습니다" });
  } catch (error) {
    return errorResponse(error as Error);
  }
} 