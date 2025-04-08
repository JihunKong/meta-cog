import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

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

    // 사용자 목록 조회 (Prisma 사용)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
        student_id: true,
        image: true,
        emailVerified: true
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    return successResponse(users);
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
    const { name, email, password, role, student_id } = body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      throw new ApiError(400, "이름, 이메일, 비밀번호는 필수 항목입니다");
    }

    // Prisma를 사용하여 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || "STUDENT",
        student_id: student_id || null,
        emailVerified: new Date(),
        raw_user_meta_data: { name }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
        student_id: true,
        image: true,
        emailVerified: true
      }
    });

    return successResponse(user);
  } catch (error) {
    console.error('사용자 생성 API 오류:', error);
    return errorResponse(error as Error);
  }
} 