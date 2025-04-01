import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { z } from "zod";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const roleSchema = z.object({
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
});

// 사용자 역할 변경 API
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("사용자 역할 변경 API 시작");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    const id = params.id;
    
    // 자기 자신의 역할은 변경할 수 없음
    if (id === session.user.id) {
      throw new ApiError(400, "자신의 역할은 변경할 수 없습니다");
    }

    // 사용자 존재 확인 (관리자 권한 사용)
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    const { body } = await validateRequest(request, "PATCH");
    const { role } = roleSchema.parse(body);

    // 사용자 역할 변경 (관리자 권한 사용)
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('User')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new ApiError(500, "역할 변경 중 오류가 발생했습니다: " + updateError.message);
    }

    return successResponse(updatedUser);
  } catch (error) {
    console.error('사용자 역할 변경 API 오류:', error);
    return errorResponse(error as Error);
  }
} 