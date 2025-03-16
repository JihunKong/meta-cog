import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    // 인증 및 권한 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 모든 데이터 가져오기
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const studyPlans = await prisma.studyPlan.findMany();
    const curriculums = await prisma.curriculum.findMany();
    const aiRecommendations = await prisma.aIRecommendation.findMany();

    // 백업 데이터 구성
    const backupData = {
      metadata: {
        version: "1.0",
        timestamp: new Date().toISOString(),
        generatedBy: user.email,
      },
      data: {
        users,
        studyPlans,
        curriculums,
        aiRecommendations,
      },
    };

    return NextResponse.json(backupData, { status: 200 });
  } catch (error) {
    console.error("데이터 백업 오류:", error);
    return NextResponse.json(
      { error: "데이터 백업 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 