import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// 학생 목록 조회 API (교사만 접근 가능)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    // URL에서 role 파라미터 추출
    const url = new URL(req.url);
    const role = url.searchParams.get("role");

    // 학생 목록 조회 (role 파라미터가 있으면 해당 역할의 사용자만 조회)
    const users = await prisma.user.findMany({
      where: {
        role: role || "STUDENT", // 기본값은 STUDENT
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: [
        { name: 'asc' }, // 이름 알파벳 순으로 정렬
      ],
    });

    return successResponse(users);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 