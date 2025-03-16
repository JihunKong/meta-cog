"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useState, useEffect } from "react";

interface SignInFormProps {
  providers: Record<string, any>;
}

export default function SignInForm({ providers }: SignInFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const error = searchParams?.get("error");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [noProviders, setNoProviders] = useState(false);

  useEffect(() => {
    // 디버깅을 위한 로그 출력
    console.log("로그인 폼 렌더링:", { 
      providers, 
      callbackUrl,
      error,
      providerExists: providers && Object.values(providers).some(provider => provider.id === "google")
    });
    
    // 구글 프로바이더가 없는 경우 상태 설정
    if (!providers || !Object.values(providers).some(provider => provider.id === "google")) {
      console.error("구글 인증 프로바이더가 없습니다!");
      setNoProviders(true);
    }
  }, [providers, callbackUrl, error]);

  const handleOAuthSignIn = async (providerId: string) => {
    try {
      console.log(`${providerId} 프로바이더로 로그인 시도 중...`);
      setLoading(prev => ({ ...prev, [providerId]: true }));
      
      const result = await signIn(providerId, { 
        callbackUrl,
        redirect: true
      });
      
      console.log("로그인 결과:", result);
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
      setLoading(prev => ({ ...prev, [providerId]: false }));
    }
  };

  // 오류 메시지 상세화
  const getErrorMessage = () => {
    if (error === "OAuthSignin") return "OAuth 로그인 시작 중 오류가 발생했습니다.";
    if (error === "OAuthCallback") return "OAuth 콜백 처리 중 오류가 발생했습니다.";
    if (error === "OAuthCreateAccount") return "OAuth 계정 생성 중 오류가 발생했습니다.";
    if (error === "EmailCreateAccount") return "이메일 계정 생성 중 오류가 발생했습니다.";
    if (error === "Callback") return "콜백 처리 중 오류가 발생했습니다.";
    if (error === "AccessDenied") return "접근이 거부되었습니다. 허용된 이메일 도메인인지 확인하세요.";
    if (error === "OAuthAccountNotLinked") return "이미 다른 방식으로 가입된 계정입니다.";
    return "로그인에 실패했습니다. 이메일 도메인을 확인해주세요.";
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {getErrorMessage()}
        </div>
      )}
      
      {noProviders && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
          구글 로그인 제공자를 불러오지 못했습니다. 관리자에게 문의하세요.
        </div>
      )}
      
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <p className="text-center text-gray-600 mb-4">
          @e.jne.go.kr 학생 계정 또는 @h.jne.go.kr 교사 계정으로 로그인해주세요
        </p>
        
        {providers &&
          Object.values(providers).filter(provider => provider.id === "google").map((provider) => (
            <Button
              key={provider.id}
              onClick={() => handleOAuthSignIn(provider.id)}
              className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex justify-center items-center"
              disabled={loading[provider.id]}
            >
              {loading[provider.id] ? (
                <>
                  <Icons.spinner className="animate-spin mr-2 h-4 w-4" />
                  로그인 중...
                </>
              ) : (
                <>
                  <Icons.google className="mr-2 h-4 w-4" />
                  {`${provider.name}로 로그인하기`}
                </>
              )}
            </Button>
          ))}
          
        {(!providers || Object.keys(providers).length === 0) && (
          <div className="text-center text-gray-500 mt-4">
            인증 제공자를 불러오는 중에 문제가 발생했습니다.
          </div>
        )}
      </div>
    </div>
  );
} 