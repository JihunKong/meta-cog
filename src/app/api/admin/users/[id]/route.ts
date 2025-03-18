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

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    const id = params.id;
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        studyPlans: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    return successResponse(user);
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
    
    // 사용자의 모든 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 1. 학습 계획 삭제
      await tx.studyPlan.deleteMany({
        where: { userId: id }
      });
      
      // 2. 과목별 진도 삭제
      await tx.curriculumProgress.deleteMany({
        where: { userId: id }
      });
      
      // 3. AI 추천 삭제
      await tx.aIRecommendation.deleteMany({
        where: { userId: id }
      });
      
      // 4. 세션 삭제
      await tx.session.deleteMany({
        where: { userId: id }
      });
      
      // 5. 계정 삭제
      await tx.user.delete({
        where: { id }
      });
    });

    return successResponse({ message: "사용자가 성공적으로 삭제되었습니다" });
  } catch (error) {
    return errorResponse(error as Error);
  }
} 