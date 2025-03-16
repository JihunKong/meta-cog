import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
});

// 사용자 역할 변경 API
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다");
    }

    const { body } = await validateRequest(request, "PATCH");
    const { role } = roleSchema.parse(body);

    // 사용자 역할 변경
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return successResponse(updatedUser);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 