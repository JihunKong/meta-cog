import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { hash, compare } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }
    
    const userId = session.user.id;
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });
    
    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }
    
    // 요청 본문에서 현재 비밀번호와 새 비밀번호 가져오기
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "현재 비밀번호와 새 비밀번호가 필요합니다");
    }
    
    if (newPassword.length < 6) {
      throw new ApiError(400, "새 비밀번호는 최소 6자 이상이어야 합니다");
    }
    
    // 현재 비밀번호 확인
    if (!user.password) {
      throw new ApiError(400, "비밀번호가 설정되어 있지 않습니다. 관리자에게 문의하세요");
    }
    
    const isPasswordValid = await compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new ApiError(400, "현재 비밀번호가 일치하지 않습니다");
    }
    
    // 새 비밀번호 해싱
    const hashedPassword = await hash(newPassword, 10);
    
    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    return successResponse({
      message: "비밀번호가 성공적으로 변경되었습니다",
    });
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    return errorResponse(error as Error);
  }
} 