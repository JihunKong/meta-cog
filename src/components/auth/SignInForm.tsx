"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useState, useEffect } from "react";

interface SignInFormProps {
  providers: Record<string, any>;
  // URL 파라미터는 직접 전달받을 수도 있습니다(필요 시)
  urlError?: string;
  urlCallbackUrl?: string;
}

export default function SignInForm({ providers }: SignInFormProps) {
  // useSearchParams를 사용하되, 항상 안전하게 처리
  const searchParams = useSearchParams?.() || null;
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const error = searchParams?.get("error") || null;
  
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [noProviders, setNoProviders] = useState(false);
  const [googleProvider, setGoogleProvider] = useState<any>(null);

  useEffect(() => {
    // useSearchParams가 없는 환경에서도 안전하게 작동하도록 처리
    const searchedError = error;
    const searchedCallbackUrl = callbackUrl;
    
    // 디버깅을 위한 로그 출력
    console.log("로그인 폼 렌더링:", { 
      providers, 
      callbackUrl: searchedCallbackUrl,
      error: searchedError,
      providerExists: providers && Object.values(providers).some(provider => provider.id === "google")
    });
    
    // providers에서 Google 프로바이더 찾기
    if (providers && Object.values(providers).some(provider => provider.id === "google")) {
      const googleProv = Object.values(providers).find(provider => provider.id === "google");
      setGoogleProvider(googleProv);
      console.log("구글 프로바이더 발견:", googleProv);
    } else {
      // 프로바이더가 없거나 Google 프로바이더가 없는 경우 하드코딩된 값 사용
      console.log("구글 프로바이더가 없어 기본값 사용");
      setNoProviders(true);
      setGoogleProvider({
        id: "google",
        name: "Google",
        type: "oauth"
      });
    }
  }, [providers, callbackUrl, error]);

  const handleOAuthSignIn = async (providerId: string) => {
    try {
      console.log(`${providerId} 프로바이더로 로그인 시도 중...`);
      setLoading(prev => ({ ...prev, [providerId]: true }));
      
      // 브라우저 캐시 문제를 해결하기 위해 타임스탬프 추가
      const timestamp = new Date().getTime();
      
      // 구글 로그인으로 직접 리디렉션 (두 가지 방법 모두 시도)
      // 방법 1: NextAuth의 signIn 함수 사용
      try {
        console.log("signIn 함수로 로그인 시도");
        await signIn(providerId, { 
          callbackUrl,
          redirect: true
        });
      } catch (signInError) {
        console.error("signIn 함수 오류:", signInError);
        
        // 방법 2: 직접 URL로 리디렉션 (signIn 함수가 실패한 경우 백업)
        console.log("직접 URL 리디렉션으로 로그인 시도");
        window.location.href = `/api/auth/signin/${providerId}?callbackUrl=${encodeURIComponent(callbackUrl)}&t=${timestamp}`;
      }
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
      setLoading(prev => ({ ...prev, [providerId]: false }));
      
      // 모든 시도가 실패한 경우 최종 대안으로 직접 URL 구성
      try {
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}/api/auth/signin/${providerId}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      } catch (finalError) {
        console.error("최종 로그인 시도 실패:", finalError);
      }
    }
  };

  // 오류 메시지 상세화
  const getErrorMessage = () => {
    if (!error) return null;
    
    console.log("로그인 오류 코드:", error);
    
    if (error === "OAuthSignin") return "OAuth 로그인 시작 중 오류가 발생했습니다. 브라우저 설정을 확인해주세요.";
    if (error === "OAuthCallback") return "OAuth 콜백 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
    if (error === "OAuthCreateAccount") return "OAuth 계정 생성 중 오류가 발생했습니다. 관리자에게 문의하세요.";
    if (error === "EmailCreateAccount") return "이메일 계정 생성 중 오류가 발생했습니다. 관리자에게 문의하세요.";
    if (error === "Callback") return "콜백 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
    if (error === "AccessDenied") return "접근이 거부되었습니다. 허용된 이메일 도메인(@e.jne.go.kr 또는 @h.jne.go.kr)인지 확인하세요.";
    if (error === "OAuthAccountNotLinked") return "이미 다른 방식으로 가입된 계정입니다. 관리자에게 문의하세요.";
    if (error === "google") return "구글 로그인에 실패했습니다. 허용된 계정인지 확인하거나 브라우저 쿠키를 초기화해보세요.";
    if (error === "Verification") return "인증 토큰 검증에 실패했습니다. 다시 시도해주세요.";
    if (error === "Configuration") return "서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.";
    return "로그인에 실패했습니다. 허용된 이메일(@e.jne.go.kr 또는 @h.jne.go.kr)인지 확인하거나 관리자에게 문의하세요.";
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
          구글 로그인 제공자를 불러오지 못했습니다. 직접 로그인을 시도합니다.
        </div>
      )}
      
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <p className="text-center text-gray-600 mb-4">
          @e.jne.go.kr 학생 계정 또는 @h.jne.go.kr 교사 계정으로 로그인해주세요
        </p>
        
        {googleProvider && (
          <Button
            key={googleProvider.id}
            onClick={() => handleOAuthSignIn(googleProvider.id)}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex justify-center items-center"
            disabled={loading[googleProvider.id]}
          >
            {loading[googleProvider.id] ? (
              <>
                <Icons.spinner className="animate-spin mr-2 h-4 w-4" />
                로그인 중...
              </>
            ) : (
              <>
                <Icons.google className="mr-2 h-4 w-4" />
                {`Google로 로그인하기`}
              </>
            )}
          </Button>
        )}
          
        {!googleProvider && (
          <div className="text-center text-gray-500 mt-4">
            인증 제공자를 불러오는 중에 문제가 발생했습니다.
          </div>
        )}
      </div>
    </div>
  );
} 