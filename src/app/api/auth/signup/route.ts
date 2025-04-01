import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    console.log("회원가입 API 시작");
    const body = await req.json();
    const { email, password, name } = body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      throw new ApiError(400, "이메일, 비밀번호, 이름은 필수 항목입니다");
    }

    // 비밀번호 유효성 검사
    if (password.length < 6) {
      throw new ApiError(400, "비밀번호는 최소 6자 이상이어야 합니다");
    }

    console.log("사용자 생성 시도:", { email, name });

    // 1. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'STUDENT'
      }
    });

    if (authError) {
      console.error('Supabase Auth 사용자 생성 실패:', authError);
      if (authError.message.includes('already registered')) {
        throw new ApiError(400, "이미 등록된 이메일입니다");
      }
      throw new ApiError(500, "사용자 생성에 실패했습니다");
    }

    if (!authData.user) {
      throw new ApiError(500, "사용자 생성에 실패했습니다");
    }

    // 2. User 테이블에 사용자 정보 추가
    const { data: userData, error: userError } = await supabaseAdmin
      .from('User')
      .insert([{
        id: authData.user.id,
        name,
        email,
        role: 'STUDENT'
      }])
      .select()
      .single();

    if (userError) {
      // User 테이블 생성 실패 시 Auth 사용자도 삭제
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('User 테이블 데이터 생성 실패:', userError);
      throw new ApiError(500, "사용자 정보 저장에 실패했습니다");
    }

    return successResponse({
      message: "회원가입이 완료되었습니다",
      user: userData
    });
  } catch (error) {
    console.error('회원가입 API 오류:', error);
    return errorResponse(error as Error);
  }
} 