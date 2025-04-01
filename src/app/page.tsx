"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 로딩 중일 때는 아무 작업도 하지 않음
    if (status === "loading") return;

    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (!session) {
      const baseUrl = process.env.NODE_ENV === "production" 
        ? "https://meta-cog.netlify.app" 
        : window.location.origin;
      window.location.href = `${baseUrl}/auth/signin`;
      return;
    }

    // 사용자 역할에 따라 다른 페이지로 리다이렉트
    const userRole = session.user?.role;
    const baseUrl = process.env.NODE_ENV === "production" 
      ? "https://meta-cog.netlify.app" 
      : window.location.origin;

    if (userRole === "ADMIN") {
      window.location.href = `${baseUrl}/admin`;
    } else if (userRole === "TEACHER") {
      window.location.href = `${baseUrl}/teacher`;
    } else {
      window.location.href = `${baseUrl}/dashboard`;
    }
  }, [session, status]);

  // 로딩 상태일 때 표시할 UI
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 리다이렉트되는 동안 빈 화면 표시
  return null;
}
