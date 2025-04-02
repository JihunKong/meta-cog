import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const studyPlanSchema = z.object({
  subject: z.string().min(1, "과목을 입력해주세요"),
  content: z.string().min(1, "학습 내용을 입력해주세요"),
  target: z.number().min(0, "목표 달성률은 0% 이상이어야 합니다").max(100, "목표 달성률은 100% 이하여야 합니다").optional().default(100),
  date: z.string().transform((str) => new Date(str)),
  achievement: z.number().min(0).max(100).optional().default(0),
  timeSlot: z.string().min(1, "시간대를 선택해주세요"),
  reflection: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    console.log("사용자 역할:", session.user.role);
    
    let studyPlans;
    let error;

    // 역할에 따라 다른 쿼리 실행
    if (session.user.role === 'STUDENT') {
      // 학생은 자신의 학습 계획만 조회 가능
      const result = await supabaseAdmin
        .from('StudyPlan')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });
      
      studyPlans = result.data;
      error = result.error;
    } else if (session.user.role === 'TEACHER' || session.user.role === 'ADMIN') {
      // URL에서 특정 학생 ID 파라미터 추출
      const url = new URL(request.url);
      const studentId = url.searchParams.get("studentId");
      
      if (studentId) {
        // 특정 학생의 학습 계획 조회
        const result = await supabaseAdmin
          .from('StudyPlan')
          .select('*')
          .eq('user_id', studentId)
          .order('date', { ascending: false });
        
        studyPlans = result.data;
        error = result.error;
      } else {
        // 모든 학습 계획 조회 (교사/관리자)
        const result = await supabaseAdmin
          .from('StudyPlan')
          .select('*')
          .order('date', { ascending: false });
        
        studyPlans = result.data;
        error = result.error;
      }
    } else {
      throw new ApiError(403, "권한이 없습니다");
    }

    if (error) {
      throw new ApiError(500, error.message);
    }

    // Supabase 응답을 Prisma 호환 형식으로 변환 (snake_case → camelCase)
    const formattedStudyPlans = (studyPlans || []).map(plan => ({
      id: plan.id,
      userId: plan.user_id,
      subject: plan.subject,
      content: plan.content,
      target: plan.target,
      achievement: plan.achievement,
      date: plan.date,
      timeSlot: plan.time_slot,
      reflection: plan.reflection,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    }));

    return successResponse(formattedStudyPlans);
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

    console.log("사용자 세션 정보:", {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email
    });

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
        // Prisma 필드명과 Supabase 필드명 매핑
        const dataToInsert = {
          user_id: session.user.id,
          subject: validatedData.subject,
          content: validatedData.content,
          target: validatedData.target,
          achievement: validatedData.achievement,
          date: validatedData.date,
          time_slot: validatedData.timeSlot || body.time_slot || "", // timeSlot 또는 time_slot 사용 (빈 문자열 기본값 추가)
          reflection: validatedData.reflection || "",
          created_at: new Date(),
          updated_at: new Date()
        };
        
        console.log("Supabase에 삽입할 데이터:", JSON.stringify(dataToInsert, null, 2));
        
        // supabase 클라이언트 권한 확인
        console.log("Supabase 클라이언트 정보:", {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        });
        
        // 서비스 롤(관리자 권한)로 데이터 삽입
        const { data: studyPlan, error } = await supabaseAdmin
          .from('StudyPlan')
          .insert([dataToInsert])
          .select()
          .single();

        if (error) {
          console.error("Supabase 삽입 오류:", error);
          throw new Error(error.message);
        }

        console.log("Supabase 삽입 결과:", studyPlan);

        // Prisma 스타일 응답으로 변환 (camelCase)
        const formattedResponse = {
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

        return successResponse(formattedResponse, 201);
      } catch (dbError: any) {
        console.error("데이터베이스 저장 오류:", dbError);
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