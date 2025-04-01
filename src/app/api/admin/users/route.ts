import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

// 모든 사용자 목록 조회 API (관리자만 접근 가능)
export async function GET(req: Request) {
  try {
    console.log("사용자 목록 조회 API 시작");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    // 사용자 목록 조회 (관리자 권한 사용)
    const { data: users, error } = await supabaseAdmin
      .from('User')
      .select('id, name, email, role, created_at, updated_at, student_id')
      .order('role')
      .order('name');

    if (error) {
      console.error('사용자 목록 조회 오류:', error);
      throw new ApiError(500, error.message);
    }

    return successResponse(users || []);
  } catch (error) {
    console.error('사용자 목록 조회 API 오류:', error);
    return errorResponse(error as Error);
  }
}

// 새 사용자 생성 API (관리자만 접근 가능)
export async function POST(req: Request) {
  try {
    console.log("사용자 생성 API 시작");
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
    const { name, email, password, role } = body;
    const student_id = body.student_id || null;

    // 필수 필드 검증
    if (!name || !email || !password) {
      throw new ApiError(400, "이름, 이메일, 비밀번호는 필수 항목입니다");
    }

    // 1. Supabase Auth에 사용자 생성 (관리자 권한 사용)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Supabase Auth 사용자 생성 실패:', authError);
      throw new ApiError(500, authError.message);
    }

    if (!authData.user) {
      throw new ApiError(500, "사용자 생성에 실패했습니다");
    }

    // 사용자 데이터 준비
    const userData = {
      id: authData.user.id,
      name,
      email,
      role: role || "STUDENT"
    };

    // student_id가 있는 경우만 추가
    if (student_id) {
      // @ts-ignore - 스키마에 따라 student_id가 있을 수도 있고 없을 수도 있음
      userData.student_id = student_id;
    }

    // 2. User 테이블에 사용자 정보 추가 (관리자 권한 사용)
    const { data: insertedData, error: userError } = await supabaseAdmin
      .from('User')
      .insert([userData])
      .select()
      .single();

    if (userError) {
      // User 테이블 생성 실패 시 Auth 사용자도 삭제
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('User 테이블 데이터 생성 실패:', userError);
      throw new ApiError(500, userError.message);
    }

    return successResponse(insertedData);
  } catch (error) {
    console.error('사용자 생성 API 오류:', error);
    return errorResponse(error as Error);
  }
} 