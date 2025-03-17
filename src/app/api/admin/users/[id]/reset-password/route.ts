import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { hash } from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }
    
    // 관리자 권한만 허용
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }
    
    const userId = params.id;
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }
    
    // 요청 본문에서 새 비밀번호 가져오기
    const body = await request.json();
    const { newPassword } = body;
    
    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, "비밀번호는 최소 6자 이상이어야 합니다");
    }
    
    // 비밀번호 해싱
    const hashedPassword = await hash(newPassword, 10);
    
    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    return successResponse({
      message: "비밀번호가 성공적으로 재설정되었습니다",
    });
  } catch (error) {
    console.error("비밀번호 재설정 오류:", error);
    return errorResponse(error as Error);
  }
} 