import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Context {
  params: {
    id: string;
  };
}

// 학생 정보 조회 API (교사만 접근 가능)
export async function GET(request: Request, { params }: Context) {
  try {
    console.log("학생 정보 조회 API 호출됨");
    
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
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, image, role')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Supabase 쿼리 오류:", error);
      throw new ApiError(500, `데이터베이스 오류: ${error.message}`);
    }

    if (!user) {
      console.log("사용자를 찾을 수 없음:", id);
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학생만 조회 가능
    if (user.role !== "STUDENT") {
      console.log("학생이 아닌 사용자:", user.role);
      throw new ApiError(400, "학생 정보만 조회할 수 있습니다");
    }

    console.log("학생 정보 조회 성공:", user);
    return successResponse(user);
  } catch (error) {
    console.error("학생 정보 조회 API 오류:", error);
    return errorResponse(error as Error);
  }
} 