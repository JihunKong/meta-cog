"use client";

import SignInForm from "@/components/auth/SignInForm";
import { Suspense } from "react";

export default function SignInClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            청해FLAME
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자가 발급한 계정으로 로그인하세요
          </p>
        </div>
        <Suspense fallback={<div className="text-center py-4">로그인 화면 로딩 중...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
} 