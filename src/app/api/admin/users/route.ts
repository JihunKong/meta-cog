import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { supabase } from "@/lib/supabase";

// 모든 사용자 목록 조회 API (관리자만 접근 가능)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    // 사용자 목록 조회
    const { data: users, error } = await supabase
      .from('User')
      .select('*')
      .order('role')
      .order('name');

    if (error) {
      throw new ApiError(500, error.message);
    }

    return successResponse(users);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// 새 사용자 생성 API (관리자만 접근 가능)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    // 요청 본문 파싱
    const body = await req.json();
    const { name, email, password, role, student_id } = body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      throw new ApiError(400, "이름, 이메일, 비밀번호는 필수 항목입니다");
    }

    // 1. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new ApiError(500, authError.message);
    }

    if (!authData.user) {
      throw new ApiError(500, "사용자 생성에 실패했습니다");
    }

    // 2. User 테이블에 사용자 정보 추가
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          role: role || "STUDENT",
          student_id: student_id || null
        }
      ])
      .select()
      .single();

    if (userError) {
      // User 테이블 생성 실패 시 Auth 사용자도 삭제
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new ApiError(500, userError.message);
    }

    return successResponse(userData);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 