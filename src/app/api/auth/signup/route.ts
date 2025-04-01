import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role = "STUDENT" } = body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      throw new ApiError(400, "이메일, 비밀번호, 이름은 필수 항목입니다");
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

    // 2. User 테이블에 사용자 정보 추가
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          role
        }
      ])
      .select()
      .single();

    if (userError) {
      // User 테이블 생성 실패 시 Auth 사용자도 삭제
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('User 테이블 데이터 생성 실패:', userError);
      throw new ApiError(500, "사용자 정보 저장에 실패했습니다");
    }

    console.log('새 사용자 생성 성공:', userData);
    return successResponse(userData);
  } catch (error) {
    console.error('회원가입 API 오류:', error);
    return errorResponse(error as Error);
  }
} 