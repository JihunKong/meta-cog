import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { z } from "zod";

// 과목 스키마
const subjectSchema = z.object({
  name: z.string().min(1, "과목명을 입력해주세요"),
});

// 모든 과목 목록 조회
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 일반적인 과목 조회는 인증 필요 없음(일반 기능에서도 사용하기 때문)
    
    // 교과서로부터 과목 목록 가져오기
    const subjects = await prisma.curriculum.findMany({
      select: {
        subject: true,
      },
      distinct: ["subject"],
      orderBy: {
        subject: "asc",
      },
    });

    // 과목 이름만 추출하여 배열로 변환
    const subjectNames = subjects.map((s: { subject: string }) => s.subject);

    return successResponse(subjectNames);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// 새 과목 추가 (관리자만 가능)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    const { body } = await validateRequest(request, "POST");
    const { name } = subjectSchema.parse(body);

    // 이미 같은 이름의 과목이 있는지 확인
    const existingSubject = await prisma.curriculum.findFirst({
      where: {
        subject: name,
      },
    });

    if (existingSubject) {
      throw new ApiError(400, "이미 존재하는 과목입니다");
    }

    // 과목에 대한 첫 번째 단원 추가 (진입점 역할)
    const curriculum = await prisma.curriculum.create({
      data: {
        subject: name,
        unit: "기초",
        content: `${name} 과목의 기초 단원입니다.`,
        order: 1,
        createdBy: session.user.id,
      },
    });

    return successResponse(curriculum.subject, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 