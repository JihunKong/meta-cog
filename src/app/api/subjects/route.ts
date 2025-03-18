import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// 과목 목록 조회 API
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 인증 확인
    if (!session) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 기본 과목 목록 (학교 교육과정에 맞게 추가 가능)
    const defaultSubjects = [
      "국어",
      "수학",
      "영어",
      "과학",
      "사회",
      "물리학",
      "화학",
      "생명과학",
      "지구과학",
      "윤리",
      "경제",
      "정치와 법",
      "세계사",
      "동아시아사",
      "제2외국어",
      "기타",
    ];

    // 사용자 정의 과목 조회 (나중에 구현 가능)
    // const customSubjects = await prisma.subject.findMany({
    //   where: {
    //     userId: session.user.id,
    //   },
    //   select: {
    //     name: true,
    //   },
    // });
    
    // 기본 과목과 사용자 정의 과목 합치기
    // const allSubjects = [
    //   ...defaultSubjects,
    //   ...customSubjects.map((subject) => subject.name),
    // ];
    
    // 중복 제거 및 정렬
    // const uniqueSubjects = [...new Set(allSubjects)].sort();

    // 클라이언트에서 예상하는 형식으로 응답
    return successResponse(defaultSubjects);
  } catch (error) {
    console.error("[SUBJECTS_GET]", error);
    return errorResponse(error as Error);
  }
}

// 나중에 사용자 정의 과목 추가 API 구현 가능
// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     
//     // 인증 확인
//     if (!session) {
//       return NextResponse.json(
//         { error: "인증이 필요합니다." },
//         { status: 401 }
//       );
//     }
//     
//     const { name } = await req.json();
//     
//     if (!name || typeof name !== "string") {
//       return NextResponse.json(
//         { error: "유효한 과목명이 필요합니다." },
//         { status: 400 }
//       );
//     }
//     
//     // 과목 생성
//     const subject = await prisma.subject.create({
//       data: {
//         name,
//         user: {
//           connect: {
//             id: session.user.id,
//           },
//         },
//       },
//     });
//     
//     return NextResponse.json(subject);
//   } catch (error) {
//     console.error("[SUBJECTS_POST]", error);
//     return NextResponse.json(
//       { error: "과목을 추가하는데 실패했습니다." },
//       { status: 500 }
//     );
//   }
// } 