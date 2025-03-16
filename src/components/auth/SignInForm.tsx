"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

interface SignInFormProps {
  providers: Record<string, any>;
}

export default function SignInForm({ providers }: SignInFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const error = searchParams?.get("error");
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleOAuthSignIn = (providerId: string) => {
    setLoading(prev => ({ ...prev, [providerId]: true }));
    signIn(providerId, { callbackUrl });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          로그인에 실패했습니다. 이메일 도메인을 확인해주세요.
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
      </div>
    </div>
  );
} 