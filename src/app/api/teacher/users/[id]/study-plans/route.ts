// 동적 라우팅 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// Supabase 클라이언트 생성 - 런타임에만 초기화
const getSupabaseClient = () => {
  // Netlify 환경변수 이름과 일치하도록 수정
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
  
  // auth.uid() 기반 RLS 정책의 무한 재귀 문제 해결을 위해 서비스 롤 키 사용
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // 서비스 롤 키가 있으면 RLS 우회
  if (supabaseServiceRoleKey) {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  // 서비스 롤 키가 없으면 기본 키 사용
  return createClient(supabaseUrl, supabaseAnonKey);
};

interface Context {
  params: {
    id: string;
  };
}

// 학생 학습 계획 조회 API (교사만 접근 가능)
export async function GET(request: Request, { params }: Context) {
  try {
    console.log("학생 학습 계획 조회 API 호출됨");
    
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

    // Supabase 클라이언트 초기화
    const supabase = getSupabaseClient();

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
      throw new ApiError(400, "학생의 학습 계획만 조회할 수 있습니다");
    }

    // URL에서 날짜 범위 파라미터 추출
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    console.log("날짜 범위:", startDate, "~", endDate);

    // 학생 학습 계획 조회
    let query = supabase
      .from('StudyPlan')
      .select('*')
      .eq('user_id', id)
      .order('date', { ascending: false });
    
    if (startDate && endDate) {
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    }
    
    const { data: studyPlans, error: plansError } = await query;
    
    if (plansError) {
      console.error("Supabase 학습 계획 조회 오류:", plansError);
      throw new ApiError(500, `데이터베이스 오류: ${plansError.message}`);
    }

    console.log(`조회된 학습 계획 수: ${studyPlans?.length || 0}`);
    return successResponse(studyPlans || []);
  } catch (error) {
    console.error("학생 학습 계획 조회 API 오류:", error);
    return errorResponse(error as Error);
  }
} 