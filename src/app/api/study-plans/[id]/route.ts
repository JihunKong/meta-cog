import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { z } from "zod";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const studyPlanUpdateSchema = z.object({
  subject: z.string().min(1, "과목을 입력해주세요").optional(),
  content: z.string().min(1, "학습 내용을 입력해주세요").optional(),
  target: z.number().min(0, "목표 달성률은 0% 이상이어야 합니다").max(100, "목표 달성률은 100% 이하여야 합니다").optional(),
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
  time_slot: z.string().min(1, "시간대를 선택해주세요").optional(),
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
    const { id } = context.params;
    console.log("학습 계획 조회 ID:", id);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한으로 학습 계획 조회
    const { data: studyPlan, error } = await supabaseAdmin
      .from('StudyPlan')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new ApiError(404, "학습 계획을 찾을 수 없습니다");
    }

    // 사용자 권한 확인 (학생은 자신의 데이터만 조회 가능)
    if (session.user.role === 'STUDENT' && studyPlan.user_id !== session.user.id) {
      throw new ApiError(403, "해당 학습 계획에 접근할 권한이 없습니다");
    }

    // Supabase 응답을 Prisma 호환 형식으로 변환 (snake_case → camelCase)
    const formattedStudyPlan = {
      id: studyPlan.id,
      userId: studyPlan.user_id,
      subject: studyPlan.subject,
      content: studyPlan.content,
      target: studyPlan.target,
      achievement: studyPlan.achievement,
      date: studyPlan.date,
      timeSlot: studyPlan.time_slot,
      reflection: studyPlan.reflection,
      createdAt: studyPlan.created_at,
      updatedAt: studyPlan.updated_at
    };

    return successResponse(formattedStudyPlan);
  } catch (error) {
    console.error("학습 계획 조회 오류:", error);
    return errorResponse(error as Error);
  }
}

// 학습 계획 수정
export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = context.params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 학습 계획 조회
    const { data: existingPlan, error: findError } = await supabaseAdmin
      .from('StudyPlan')
      .select('*')
      .eq('id', id)
      .single();

    if (findError) {
      throw new ApiError(404, "학습 계획을 찾을 수 없습니다");
    }

    // 학생은 자신의 데이터만 수정 가능
    if (session.user.role === 'STUDENT' && existingPlan.user_id !== session.user.id) {
      throw new ApiError(403, "해당 학습 계획에 접근할 권한이 없습니다");
    }

    // 요청 본문 처리
    const body = await request.json();
    
    if (!body || Object.keys(body).length === 0) {
      throw new ApiError(400, "요청 본문이 비어 있습니다");
    }

    // 목표 달성률 처리
    if (body.targetAchievement !== undefined) {
      body.target = body.targetAchievement;
      delete body.targetAchievement;
    }

    // 달성률 처리
    if (body.achievement !== undefined && body.achievement === null) {
      body.achievement = 0;
    }

    // 데이터 검증
    const validatedData = studyPlanUpdateSchema.parse(body);
    
    // 업데이트할 데이터 준비 - snake_case로 변환
    const updateData: any = {
      updated_at: new Date()
    };
    
    // Prisma 스타일(camelCase)에서 Supabase 스타일(snake_case)로 변환
    if (validatedData.subject) updateData.subject = validatedData.subject;
    if (validatedData.content) updateData.content = validatedData.content;
    if (validatedData.target !== undefined) updateData.target = validatedData.target;
    if (validatedData.achievement !== undefined) updateData.achievement = validatedData.achievement;
    if (validatedData.date) updateData.date = validatedData.date;
    if (validatedData.reflection !== undefined) updateData.reflection = validatedData.reflection;

    // timeSlot 필드 처리 (camelCase → snake_case)
    if (validatedData.timeSlot) {
      updateData.time_slot = validatedData.timeSlot;
    } else if (validatedData.time_slot) {
      updateData.time_slot = validatedData.time_slot;
    } else if (body.timeSlot) {
      updateData.time_slot = body.timeSlot;
    } else if (body.time_slot) {
      updateData.time_slot = body.time_slot;
    }
    
    console.log("업데이트할 데이터:", updateData);

    // 학습 계획 업데이트 (관리자 권한 사용)
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from('StudyPlan')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new ApiError(500, "학습 계획 업데이트 중 오류가 발생했습니다: " + updateError.message);
    }

    // Supabase 응답을 Prisma 호환 형식으로 변환 (snake_case → camelCase)
    const formattedUpdatedPlan = {
      id: updatedPlan.id,
      userId: updatedPlan.user_id,
      subject: updatedPlan.subject,
      content: updatedPlan.content,
      target: updatedPlan.target,
      achievement: updatedPlan.achievement,
      date: updatedPlan.date,
      timeSlot: updatedPlan.time_slot,
      reflection: updatedPlan.reflection,
      createdAt: updatedPlan.created_at,
      updatedAt: updatedPlan.updated_at
    };

    return successResponse(formattedUpdatedPlan);
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

    // 학습 계획 조회 (관리자 권한 사용)
    const { data: existingPlan, error: findError } = await supabaseAdmin
      .from('StudyPlan')
      .select('*')
      .eq('id', id)
      .single();

    if (findError) {
      throw new ApiError(404, "학습 계획을 찾을 수 없습니다");
    }

    // 학생은 자신의 데이터만 삭제 가능
    if (session.user.role === 'STUDENT' && existingPlan.user_id !== session.user.id) {
      throw new ApiError(403, "해당 학습 계획에 접근할 권한이 없습니다");
    }

    // 학습 계획 삭제 (관리자 권한 사용)
    const { error: deleteError } = await supabaseAdmin
      .from('StudyPlan')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new ApiError(500, "학습 계획 삭제 중 오류가 발생했습니다: " + deleteError.message);
    }

    // 삭제 성공 응답
    return successResponse({ 
      message: "학습 계획이 삭제되었습니다",
      id
    });
  } catch (error) {
    console.error("학습 계획 삭제 오류:", error);
    return errorResponse(error as Error);
  }
} 