"use client";

import { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";
import { Suspense, useEffect, useState } from "react";

// 메타데이터는 서버 컴포넌트에서만 사용할 수 있으므로 export하지 않습니다
const metadata = {
  title: "로그인 - 청해FLAME",
  description: "청해FLAME 시스템에 로그인하세요.",
};

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function SignInContent() {
  // 가장 간단한 프로바이더 설정
  const [providers, setProviders] = useState({
    google: {
      id: "google",
      name: "Google",
      type: "oauth",
      signinUrl: "/api/auth/signin/google",
      callbackUrl: "/api/auth/callback/google"
    }
  });

  return <SignInForm providers={providers} />;
}

// 완전 클라이언트 컴포넌트로 변경
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            청해FLAME
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            학교 구글 계정으로 로그인하세요
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            (@e.jne.go.kr 또는 @h.jne.go.kr 계정만 사용 가능합니다)
          </p>
        </div>
        {/* Suspense 경계 추가 */}
        <Suspense fallback={<div className="text-center py-4">로그인 화면 로딩 중...</div>}>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
} 