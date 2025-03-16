import { Metadata } from "next";
import { getProviders } from "next-auth/react";
import SignInForm from "@/components/auth/SignInForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "로그인 - 청해FLAME",
  description: "청해FLAME 시스템에 로그인하세요.",
};

export default async function SignInPage() {
  const providers = await getProviders();

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
        <Suspense fallback={<div>로그인 폼 로딩 중...</div>}>
          <SignInForm providers={providers} />
        </Suspense>
      </div>
    </div>
  );
} 