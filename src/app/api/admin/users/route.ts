import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { hash } from "bcryptjs";

// 모든 사용자 목록 조회 API (관리자만 접근 가능)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    // 사용자 목록 조회
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    return successResponse(users);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// 새 사용자 생성 API (관리자만 접근 가능)
export async function POST(req: Request) {
  try {
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

    // 필수 필드 검증
    if (!name || !email || !password) {
      throw new ApiError(400, "이름, 이메일, 비밀번호는 필수 항목입니다");
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(400, "이미 사용 중인 이메일입니다");
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10);

    // 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return successResponse(newUser);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 