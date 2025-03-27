import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { z } from "zod";

const studyPlanSchema = z.object({
  subject: z.string().min(1, "과목을 입력해주세요"),
  content: z.string().min(1, "학습 내용을 입력해주세요"),
  targetAchievement: z.number().min(0, "목표 달성률은 0% 이상이어야 합니다").max(100, "목표 달성률은 100% 이하여야 합니다").optional().default(100),
  date: z.string().transform((str) => new Date(str)),
  timeSlot: z.string().min(1, "시간대를 선택해주세요"),
  reflection: z.string().optional(),
  achievement: z.number().min(0).max(100).optional().default(0),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const subject = searchParams.get("subject");

    // 기본 쿼리 조건에 userId 추가
    const where: any = {
      userId: session.user.id
    };

    // 날짜 필터링
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // 과목 필터링
    if (subject) {
      where.subject = subject;
    }

    const studyPlans = await prisma.studyPlan.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    // 날짜 형식 변환
    const formattedPlans = studyPlans.map(plan => ({
      ...plan,
      date: plan.date.toISOString(),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      targetAchievement: plan.target
    }));

    return successResponse(formattedPlans);
  } catch (error) {
    console.error("학습 계획 조회 오류:", error);
    return errorResponse(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("인증 오류: 세션이 없거나 사용자 정보가 없습니다");
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 사용자 ID 확인을 위한 디버깅 정보 추가
    console.log("세션 정보:", JSON.stringify({
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role
    }, null, 2));

    // 요청 본문 가져오기 및 기본 검증
    let body;
    try {
      body = await request.json();
      console.log("파싱된 요청 본문:", JSON.stringify(body, null, 2));
      
      if (!body || Object.keys(body).length === 0) {
        throw new ApiError(400, "요청 본문이 비어 있습니다");
      }
    } catch (error) {
      console.error("요청 본문 처리 오류:", error);
      return errorResponse(error instanceof ApiError ? error : new ApiError(400, "요청 본문을 처리할 수 없습니다"));
    }
    
    // 데이터 유효성 검사 및 저장
    try {
      const validatedData = studyPlanSchema.parse(body);
      console.log("유효성 검사 통과:", JSON.stringify(validatedData, null, 2));
      
      try {
        // 형식화된 데이터로 학습 계획 생성
        const studyPlanData = {
          ...validatedData,
          userId: session.user.id,
          target: validatedData.targetAchievement || 100
        };
        
        // targetAchievement 필드 제거 (DB에 없는 필드)
        const { targetAchievement, ...dataToSave } = studyPlanData;
        
        console.log("저장할 데이터:", JSON.stringify(dataToSave, null, 2));
        
        const studyPlan = await prisma.studyPlan.create({
          data: dataToSave
        });

        // 응답 데이터 포맷팅
        const formattedPlan = {
          ...studyPlan,
          date: studyPlan.date.toISOString(),
          createdAt: studyPlan.createdAt.toISOString(),
          updatedAt: studyPlan.updatedAt.toISOString(),
          targetAchievement: studyPlan.target
        };

        return successResponse(formattedPlan, 201);
      } catch (dbError: any) {
        console.error("데이터베이스 저장 오류:", dbError);
        if (dbError.code === 'P2003') {
          return errorResponse(new ApiError(400, "외래 키 제약 조건 위반: 유효하지 않은 사용자 ID입니다. 다시 로그인해주세요."));
        }
        return errorResponse(new ApiError(500, `학습 계획을 저장하는 중 오류가 발생했습니다: ${dbError.message || '알 수 없는 오류'}`));
      }
    } catch (validationError) {
      console.error("유효성 검사 오류:", validationError);
      if (validationError instanceof Error) {
        return errorResponse(new ApiError(400, "데이터 유효성 검사에 실패했습니다: " + validationError.message));
      }
      return errorResponse(new ApiError(400, "데이터 유효성 검사에 실패했습니다"));
    }
  } catch (error) {
    console.error("학습 계획 생성 오류:", error);
    return errorResponse(error as Error);
  }
} 