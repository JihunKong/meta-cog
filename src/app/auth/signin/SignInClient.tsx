"use client";

import SignInForm from "@/components/auth/SignInForm";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // 페이지 로딩 시 처리
  useEffect(() => {
    // 로그인 페이지가 제대로 로드되었음을 표시
    setIsLoading(false);
    
    // URL 파라미터 확인 (디버깅용)
    const callbackUrl = searchParams?.get('callbackUrl');
    console.log('로그인 페이지 로드됨, 콜백 URL:', callbackUrl);
  }, [searchParams]);
  
  // 테스트 계정으로 자동 로그인 (개발 환경에서만 사용)
  const handleTestLogin = () => {
    router.push('/dashboard');
  };
  
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
        
        {isLoading ? (
          <div className="text-center py-4">로그인 화면 로딩 중...</div>
        ) : (
          <>
            <Suspense fallback={<div className="text-center py-4">로그인 폼 로딩 중...</div>}>
              <SignInForm />
            </Suspense>
            
            {/* 개발 환경에서만 표시되는 테스트 로그인 버튼 */}
            <div className="mt-4 text-center">
              <button 
                onClick={handleTestLogin}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                관리자 대시보드로 바로 이동
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 