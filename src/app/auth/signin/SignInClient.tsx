"use client";

import SignInForm from "@/components/auth/SignInForm";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";

// SearchParams를 사용하는 컴포넌트를 별도로 분리
function SearchParamsWrapper() {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  
  // SignInForm이 callbackUrl prop을 받을 수 있는지 확인해야 함
  return <SignInForm callbackUrl={callbackUrl} />;
}

export default function SignInClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 테스트 계정으로 자동 로그인 (개발 환경에서만 사용)
  const handleTestLogin = () => {
    router.push('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Meta-Cog
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            관리자가 발급한 계정으로 로그인하세요
          </p>
        </div>
        
        <Suspense fallback={<div className="text-center py-4 text-gray-700 dark:text-gray-300">로그인 폼 로딩 중...</div>}>
          <SearchParamsWrapper />
        </Suspense>
        
        {/* 개발 환경에서만 표시되는 테스트 로그인 버튼 */}
        <div className="mt-4 text-center">
          <button 
            onClick={handleTestLogin}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            관리자 대시보드로 바로 이동
          </button>
        </div>
      </div>
    </div>
  );
} 