import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

const SETUP_SECRET = process.env.SETUP_SECRET || "temporary-setup-secret";

export async function POST(req: Request) {
  try {
    const { email, password, setupSecret } = await req.json();

    // 설정 시크릿 검증
    if (setupSecret !== SETUP_SECRET) {
      return NextResponse.json(
        { error: "Invalid setup secret" },
        { status: 401 }
      );
    }

    // 기존 관리자 계정 확인
    const existingAdmin = await db.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin account already exists" },
        { status: 400 }
      );
    }

    // 이메일 유효성 검사
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검사
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10);

    // 관리자 계정 생성
    const admin = await db.user.create({
      data: {
        email,
        name: "관리자",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Admin account created successfully",
      email: admin.email,
    });
  } catch (error) {
    console.error("[ADMIN_SETUP]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 