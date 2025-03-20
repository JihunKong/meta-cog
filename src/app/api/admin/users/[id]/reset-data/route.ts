import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }
    
    // 관리자 권한만 허용
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }
    
    const userId = params.id;
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }
    
    // 학습계획 초기화
    await prisma.studyPlan.deleteMany({
      where: { userId },
    });
    
    // 추천 초기화 - 모든 추천 테이블 시도 (대소문자 차이 고려)
    console.log(`사용자 ID ${userId}의 추천 데이터 초기화 중...`);
    
    await prisma.aIRecommendation.deleteMany({
      where: { userId },
    });
    
    await prisma.recommendation.deleteMany({
      where: { userId },
    });
    
    try {
      await prisma.aiRecommendation.deleteMany({
        where: { userId },
      });
    } catch (deleteError) {
      console.log("aiRecommendation 테이블이 없거나 삭제 오류:", deleteError);
    }
    
    try {
      await prisma.AIRecommendation.deleteMany({
        where: { userId },
      });
    } catch (deleteError) {
      console.log("AIRecommendation 테이블이 없거나 삭제 오류:", deleteError);
    }
    
    // 커리큘럼 진행 상황 초기화
    await prisma.curriculumProgress.deleteMany({
      where: { userId },
    });
    
    // 기타 학습 관련 데이터 초기화 (필요에 따라 추가)
    
    console.log(`사용자 ID ${userId}의 모든 데이터가 초기화되었습니다.`);
    
    return successResponse({
      message: "사용자 데이터가 성공적으로 초기화되었습니다",
    });
  } catch (error) {
    console.error("사용자 데이터 초기화 오류:", error);
    return errorResponse(error as Error);
  }
} 