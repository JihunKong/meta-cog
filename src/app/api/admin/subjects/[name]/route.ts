import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

interface Context {
  params: {
    name: string;
  };
}

// 특정 과목 삭제 API
export async function DELETE(request: Request, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    const { name } = params;
    const decodedName = decodeURIComponent(name);

    // 진도 사용 여부 확인
    const progressCount = await prisma.curriculumProgress.count({
      where: {
        curriculum: {
          subject: decodedName
        }
      }
    });

    if (progressCount > 0) {
      throw new ApiError(400, "학습 진도가 있는 과목은 삭제할 수 없습니다");
    }

    // 학습 계획 사용 여부 확인
    const studyPlanCount = await prisma.studyPlan.count({
      where: {
        subject: decodedName
      }
    });

    if (studyPlanCount > 0) {
      throw new ApiError(400, "학습 계획이 있는 과목은 삭제할 수 없습니다");
    }

    // 과목 관련 교과서 단원 삭제
    const deletedCurriculums = await prisma.curriculum.deleteMany({
      where: {
        subject: decodedName,
      },
    });

    return successResponse({ 
      message: "과목이 삭제되었습니다", 
      count: deletedCurriculums.count 
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
} 