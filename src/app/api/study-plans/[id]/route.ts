import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { z } from "zod";

const studyPlanUpdateSchema = z.object({
  subject: z.string().min(1, "과목을 입력해주세요").optional(),
  content: z.string().min(1, "학습 내용을 입력해주세요").optional(),
  targetAchievement: z.number().min(0, "목표 달성률은 0% 이상이어야 합니다").max(100, "목표 달성률은 100% 이하여야 합니다").optional().default(100),
  // achievement를 달성률 퍼센트(0-100)로 저장
  achievement: z.union([
    z.number().min(0, "달성률은 0% 이상이어야 합니다").max(100, "달성률은 100% 이하여야 합니다"),
    z.null()
  ]).optional().transform(val => val === null ? 0 : val),
  date: z.string().transform((str) => {
    try {
      return new Date(str);
    } catch (error) {
      console.error("날짜 형식 오류:", str, error);
      return new Date(); // 오류 시 현재 날짜 반환
    }
  }).optional(),
  timeSlot: z.string().min(1, "시간대를 선택해주세요").optional(),
  reflection: z.string().optional(),
});

interface Context {
  params: {
    id: string;
  };
}

// 특정 학습 계획 조회
export async function GET(request: Request, context: Context) {
  try {
    // 비동기적으로 params 접근
    const { id } = context.params;
    console.log("학습 계획 조회 ID:", id);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 디버깅을 위한 코드 추가
    console.log("학습 계획 조회 시도:", { planId: id, userId: session.user.id });
    
    // 1. 먼저 ID만으로 학습 계획이 존재하는지 확인
    const anyPlan = await prisma.studyPlan.findUnique({
      where: {
        id,
      },
    });
    
    console.log("ID로만 찾은 학습 계획:", anyPlan);
    
    // 2. 원래 로직대로 ID와 사용자 ID로 함께 찾기
    const studyPlan = await prisma.studyPlan.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    console.log("ID와 사용자 ID로 찾은 학습 계획:", studyPlan);

    if (!studyPlan) {
      // 학습 계획이 존재하지만 현재 사용자의 것이 아닌 경우
      if (anyPlan) {
        console.log("학습 계획이 존재하지만 현재 사용자의 것이 아님");
        throw new ApiError(403, "해당 학습 계획에 접근할 권한이 없습니다");
      } else {
        console.log("학습 계획이 존재하지 않음");
        throw new ApiError(404, "학습 계획을 찾을 수 없습니다");
      }
    }

    // 날짜 처리를 클라이언트에서 더 쉽게 할 수 있도록 문자열 형식 유지
    const formattedPlan = {
      ...studyPlan,
      date: studyPlan.date.toISOString(),
      createdAt: studyPlan.createdAt.toISOString(),
      updatedAt: studyPlan.updatedAt.toISOString(),
      targetAchievement: studyPlan.target // target 값을 그대로 targetAchievement로 사용
    };

    return successResponse(formattedPlan);
  } catch (error) {
    console.error("학습 계획 조회 오류:", error);
    return errorResponse(error as Error);
  }
}

// 학습 계획 수정
export async function PATCH(request: Request, context: Context) {
  try {
    // 비동기적으로 params 접근
    const { id } = context.params;
    console.log("학습 계획 수정 ID:", id);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 학습 계획 존재 확인 및 소유권 확인 (디버깅용으로 수정)
    console.log("학습 계획 찾기 시도:", { planId: id, userId: session.user.id });
    
    // 1. 먼저 ID만으로 학습 계획이 존재하는지 확인
    const anyPlan = await prisma.studyPlan.findUnique({
      where: {
        id,
      },
    });
    
    console.log("ID로만 찾은 학습 계획:", anyPlan);
    
    // 2. 원래 로직대로 ID와 사용자 ID로 함께 찾기
    const existingPlan = await prisma.studyPlan.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    console.log("ID와 사용자 ID로 찾은 학습 계획:", existingPlan);

    if (!existingPlan) {
      // 학습 계획이 존재하지만 현재 사용자의 것이 아닌 경우
      if (anyPlan) {
        console.log("학습 계획이 존재하지만 현재 사용자의 것이 아님");
        throw new ApiError(403, "해당 학습 계획에 접근할 권한이 없습니다");
      } else {
        console.log("학습 계획이 존재하지 않음");
        throw new ApiError(404, "학습 계획을 찾을 수 없습니다");
      }
    }

    let body: any; // body에 임의 속성을 추가할 수 있도록 any 타입 사용
    
    try {
      // JSON 형식으로 직접 파싱
      body = await request.json();
      console.log("파싱된 요청 본문 (PATCH):", JSON.stringify(body, null, 2));
      
      if (!body || Object.keys(body).length === 0) {
        throw new ApiError(400, "요청 본문이 비어 있습니다");
      }
    } catch (error) {
      console.error("요청 본문 처리 오류 (PATCH):", error);
      return errorResponse(error instanceof ApiError ? error : new ApiError(400, "요청 본문을 처리할 수 없습니다"));
    }

    // achievement와 reflection 업데이트 로직 개선
    if (body.achievement !== undefined || body.reflection !== undefined) {
      // achievement 값이 null인 경우 0으로 설정
      if (body.achievement === null) {
        body.achievement = 0;
      }
      
      // achievement 값이 0-100 범위를 벗어나는 경우 제한
      if (typeof body.achievement === 'number') {
        body.achievement = Math.min(Math.max(0, body.achievement), 100);
      }
      
      console.log("업데이트할 데이터:", {
        achievement: body.achievement,
        reflection: body.reflection
      });
    }

    // targetAchievement를 target으로 변환 (DB 스키마에 맞춤)
    if (body.targetAchievement !== undefined) {
      body.target = body.targetAchievement;
      // body 객체에서 targetAchievement 속성 제거
      const { targetAchievement, ...rest } = body;
      body = rest;
    }

    const validatedData = studyPlanUpdateSchema.parse(body);

    // DB 스키마에 맞게 최종 데이터 준비
    const dataToUpdate: any = { ...validatedData };
    
    // validatedData에 targetAchievement가 있으면 target으로 변환
    if ('targetAchievement' in validatedData) {
      dataToUpdate.target = validatedData.targetAchievement;
      // targetAchievement 키 제거 (Prisma 스키마에 없는 필드)
      delete dataToUpdate.targetAchievement;
    }

    const updatedStudyPlan = await prisma.studyPlan.update({
      where: {
        id,
      },
      data: dataToUpdate,
    });

    // 클라이언트 측에서의 날짜 처리를 위한 변환
    const formattedPlan = {
      ...updatedStudyPlan,
      date: updatedStudyPlan.date.toISOString(),
      createdAt: updatedStudyPlan.createdAt.toISOString(),
      updatedAt: updatedStudyPlan.updatedAt.toISOString(),
      targetAchievement: updatedStudyPlan.target // target 값을 그대로 targetAchievement로 사용
    };

    return successResponse(formattedPlan);
  } catch (error) {
    console.error("학습 계획 수정 오류:", error);
    return errorResponse(error as Error);
  }
}

// 학습 계획 삭제
export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = context.params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 디버깅을 위한 코드 추가
    console.log("학습 계획 삭제 시도:", { planId: id, userId: session.user.id });
    
    // 1. 먼저 ID만으로 학습 계획이 존재하는지 확인
    const anyPlan = await prisma.studyPlan.findUnique({
      where: {
        id,
      },
    });
    
    console.log("ID로만 찾은 학습 계획:", anyPlan);
    
    // 2. 원래 로직대로 ID와 사용자 ID로 함께 찾기
    const existingPlan = await prisma.studyPlan.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    console.log("ID와 사용자 ID로 찾은 학습 계획:", existingPlan);

    if (!existingPlan) {
      // 학습 계획이 존재하지만 현재 사용자의 것이 아닌 경우
      if (anyPlan) {
        console.log("학습 계획이 존재하지만 현재 사용자의 것이 아님");
        throw new ApiError(403, "해당 학습 계획에 접근할 권한이 없습니다");
      } else {
        console.log("학습 계획이 존재하지 않음");
        throw new ApiError(404, "학습 계획을 찾을 수 없습니다");
      }
    }

    // 학습 계획 삭제
    await prisma.studyPlan.delete({
      where: {
        id,
      },
    });

    console.log("학습 계획 삭제 완료:", id);
    return successResponse({ message: "학습 계획이 삭제되었습니다" });
  } catch (error) {
    console.error("학습 계획 삭제 오류:", error);
    return errorResponse(error as Error);
  }
} 