import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

interface Context {
  params: {
    id: string;
  };
}

// 학생 정보 조회 API (교사만 접근 가능)
export async function GET(request: Request, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    const { id } = params;

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    // 학생만 조회 가능
    if (user.role !== "STUDENT") {
      throw new ApiError(400, "학생 정보만 조회할 수 있습니다");
    }

    return successResponse(user);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 