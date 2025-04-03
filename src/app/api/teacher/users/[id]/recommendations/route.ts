import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { RecommendationType } from "@/types";

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Context {
  params: {
    id: string;
  };
}

// 학생 AI 추천 조회 API (교사만 접근 가능)
export async function GET(request: Request, { params }: Context) {
  try {
    console.log("학생 AI 추천 조회 API 호출됨");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("인증 실패: 세션 없음");
      throw new ApiError(401, "인증이 필요합니다");
    }

    console.log("인증된 사용자:", session.user.email, "역할:", session.user.role);

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      console.log("권한 오류: 교사 또는 관리자가 아님");
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    const { id } = params;
    console.log("조회할 학생 ID:", id);

    // 사용자 확인
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', id)
      .single();

    if (userError) {
      console.error("Supabase 사용자 조회 오류:", userError);
      throw new ApiError(500, `데이터베이스 오류: ${userError.message}`);
    }

    if (!user) {
      console.log("사용자를 찾을 수 없음:", id);
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학생만 조회 가능
    if (user.role !== "STUDENT") {
      console.log("학생이 아닌 사용자:", user.role);
      throw new ApiError(400, "학생의 AI 추천만 조회할 수 있습니다");
    }

    // 학생 AI 추천 조회
    const { data: recommendations, error: recError } = await supabase
      .from('AIRecommendation')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (recError) {
      console.error("Supabase AI 추천 조회 오류:", recError);
      throw new ApiError(500, `데이터베이스 오류: ${recError.message}`);
    }

    // 필드명 매핑 추가 (snake_case에서 camelCase로)
    const mappedRecommendations = (recommendations || []).map((rec: any) => ({
      id: rec.id,
      userId: rec.user_id,
      user_id: rec.user_id, // 둘 다 제공하여 호환성 유지
      subject: rec.subject,
      content: rec.content,
      type: rec.type,
      createdAt: rec.created_at,
      created_at: rec.created_at // 둘 다 제공하여 호환성 유지
    }));

    console.log(`조회된 AI 추천 수: ${recommendations?.length || 0}`);
    return successResponse(mappedRecommendations);
  } catch (error) {
    console.error("학생 AI 추천 조회 API 오류:", error);
    return errorResponse(error as Error);
  }
}

// 학생 AI 추천 생성 API (교사만 접근 가능)
export async function POST(request: Request, { params }: Context) {
  try {
    console.log("학생 AI 추천 생성 API 호출됨");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("인증 실패: 세션 없음");
      throw new ApiError(401, "인증이 필요합니다");
    }

    console.log("인증된 사용자:", session.user.email, "역할:", session.user.role);

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      console.log("권한 오류: 교사 또는 관리자가 아님");
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    const { id } = params;
    console.log("AI 추천을 생성할 학생 ID:", id);

    // 사용자 확인
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role, name')
      .eq('id', id)
      .single();

    if (userError) {
      console.error("Supabase 사용자 조회 오류:", userError);
      throw new ApiError(500, `데이터베이스 오류: ${userError.message}`);
    }

    if (!user) {
      console.log("사용자를 찾을 수 없음:", id);
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학생만 추천 생성 가능
    if (user.role !== "STUDENT") {
      console.log("학생이 아닌 사용자:", user.role);
      throw new ApiError(400, "학생에게만 AI 추천을 생성할 수 있습니다");
    }

    // 학생의 최근 학습 계획 조회
    const { data: recentStudyPlans, error: plansError } = await supabase
      .from('StudyPlan')
      .select('*')
      .eq('user_id', id)
      .order('date', { ascending: false })
      .limit(10);

    if (plansError) {
      console.error("Supabase 학습 계획 조회 오류:", plansError);
      throw new ApiError(500, `데이터베이스 오류: ${plansError.message}`);
    }

    if (!recentStudyPlans || recentStudyPlans.length === 0) {
      console.log("학습 계획이 없음");
      throw new ApiError(400, "학습 계획이 없어 AI 추천을 생성할 수 없습니다");
    }

    // 학습 계획 분석 및 추천 생성
    console.log("학습 계획 분석 시작");
    const subjects = [...new Set(recentStudyPlans.map((plan: any) => plan.subject))];
    const completedPlans = recentStudyPlans.filter((plan: any) => plan.achievement > 0);
    const incompletePlans = recentStudyPlans.filter((plan: any) => plan.achievement === 0);
    
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

    console.log("AI 추천 내용 생성 완료");

    // AI 추천 저장
    const { data: recommendation, error: insertError } = await supabase
      .from('AIRecommendation')
      .insert({
        user_id: id,
        subject: recommendationSubject,
        content: recommendationContent,
        type: recommendationType,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase AI 추천 저장 오류:", insertError);
      throw new ApiError(500, `데이터베이스 오류: ${insertError.message}`);
    }

    // 필드명 매핑 추가 (snake_case에서 camelCase로)
    const mappedRecommendation = {
      id: recommendation.id,
      userId: recommendation.user_id,
      user_id: recommendation.user_id,
      subject: recommendation.subject,
      content: recommendation.content,
      type: recommendation.type,
      createdAt: recommendation.created_at,
      created_at: recommendation.created_at
    };

    console.log("AI 추천 생성 완료:", recommendation.id);
    return successResponse(mappedRecommendation);
  } catch (error) {
    console.error("학생 AI 추천 생성 API 오류:", error);
    return errorResponse(error as Error);
  }
} 