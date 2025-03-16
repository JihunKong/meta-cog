import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { RecommendationType } from "@/types";

interface Context {
  params: {
    id: string;
  };
}

// 학생 AI 추천 조회 API (교사만 접근 가능)
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
      throw new ApiError(400, "학생의 AI 추천만 조회할 수 있습니다");
    }

    // 학생 AI 추천 조회
    const recommendations = await prisma.aIRecommendation.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(recommendations);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// 학생 AI 추천 생성 API (교사만 접근 가능)
export async function POST(request: Request, { params }: Context) {
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

    // 학생만 추천 생성 가능
    if (user.role !== "STUDENT") {
      throw new ApiError(400, "학생에게만 AI 추천을 생성할 수 있습니다");
    }

    // 학생의 최근 학습 계획 조회
    const recentStudyPlans = await prisma.studyPlan.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    if (recentStudyPlans.length === 0) {
      throw new ApiError(400, "학습 계획이 없어 AI 추천을 생성할 수 없습니다");
    }

    // 학습 계획 분석 및 추천 생성 (실제로는 AI 모델을 호출하여 생성)
    // 여기서는 간단한 예시로 구현
    const subjects = [...new Set(recentStudyPlans.map(plan => plan.subject))];
    const completedPlans = recentStudyPlans.filter(plan => plan.achievement > 0);
    const incompletePlans = recentStudyPlans.filter(plan => plan.achievement === 0);
    
    // 추천 유형 결정
    let recommendationType: RecommendationType = "STRATEGY";
    if (incompletePlans.length > completedPlans.length) {
      recommendationType = "SCHEDULE";
    } else if (subjects.length > 3) {
      recommendationType = "SUBJECT";
    }

    // 추천 내용 생성
    let recommendationContent = "";
    let recommendationSubject = "학습 전략";
    
    if (recommendationType === "STRATEGY") {
      recommendationContent = `최근 학습 계획을 분석한 결과, ${subjects.join(', ')} 과목에서 좋은 성과를 보이고 있습니다. 계속해서 현재의 학습 전략을 유지하되, 각 과목별로 복습 시간을 조금 더 늘려보는 것이 좋겠습니다.`;
    } else if (recommendationType === "SCHEDULE") {
      recommendationContent = `최근 완료하지 못한 학습 계획이 많습니다. 하루에 계획하는 학습량을 조금 줄이고, 꾸준히 완료할 수 있는 양으로 조정해보세요. 특히 ${incompletePlans[0]?.subject || '주요 과목'}에 집중하는 것이 좋겠습니다.`;
      recommendationSubject = "학습 일정";
    } else {
      recommendationContent = `다양한 과목을 학습하고 있어 좋습니다. 하지만 너무 많은 과목을 동시에 학습하면 효율이 떨어질 수 있습니다. ${subjects.slice(0, 2).join(', ')}에 우선순위를 두고 집중적으로 학습해보세요.`;
      recommendationSubject = "과목 선택";
    }

    // AI 추천 저장
    const recommendation = await prisma.aIRecommendation.create({
      data: {
        userId: id,
        subject: recommendationSubject,
        content: recommendationContent,
        type: recommendationType,
      },
    });

    return successResponse(recommendation);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 