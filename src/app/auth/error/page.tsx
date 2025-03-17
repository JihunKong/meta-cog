"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Icons } from "@/components/ui/icons";

// 이 컴포넌트가 useSearchParams를 사용합니다
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") || null;

  // 오류 메시지와 설명 가져오기
  const getErrorDetails = () => {
    switch (error) {
      case "CredentialsSignin":
        return {
          title: "로그인 실패",
          description: "이메일 또는 비밀번호가 일치하지 않습니다.",
          icon: <Icons.xCircle className="h-16 w-16 text-red-500" />,
          color: "red"
        };
      case "AccessDenied":
        return {
          title: "접근 권한 없음",
          description: "이 리소스에 접근할 권한이 없습니다. 관리자에게 문의하세요.",
          icon: <Icons.lock className="h-16 w-16 text-yellow-500" />,
          color: "yellow"
        };
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
      case "OAuthAccountNotLinked":
      case "EmailSignin":
      case "CredentialsSignup":
        return {
          title: "인증 오류",
          description: "인증 과정에서 문제가 발생했습니다. 다시 시도하거나 관리자에게 문의하세요.",
          icon: <Icons.warning className="h-16 w-16 text-amber-500" />,
          color: "amber"
        };
      case "Configuration":
        return {
          title: "서버 설정 오류",
          description: "서버 설정에 문제가 있습니다. 관리자에게 문의하세요.",
          icon: <Icons.server className="h-16 w-16 text-purple-500" />,
          color: "purple"
        };
      case "Verification":
        return {
          title: "인증 링크 만료",
          description: "인증 링크가 만료되었거나 이미 사용되었습니다. 새 인증 링크를 요청하세요.",
          icon: <Icons.clock className="h-16 w-16 text-blue-500" />,
          color: "blue"
        };
      default:
        return {
          title: "로그인 오류",
          description: "로그인 중 알 수 없는 오류가 발생했습니다. 다시 시도하거나 관리자에게 문의하세요.",
          icon: <Icons.alertTriangle className="h-16 w-16 text-orange-500" />,
          color: "orange"
        };
    }
  };

  const errorDetails = getErrorDetails();
  const colorClasses = {
    red: "bg-red-50 border-red-200 text-red-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700"
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className={`p-8 rounded-lg shadow-lg bg-white border ${colorClasses[errorDetails.color]}`}>
          <div className="flex flex-col items-center">
            {errorDetails.icon}
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {errorDetails.title}
            </h2>
            <p className="mt-2 text-center text-lg text-gray-600">
              {errorDetails.description}
            </p>
            <div className="mt-8 animate-pulse">
              {error === "CredentialsSignin" && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
                  <p className="font-medium">가능한 원인:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>이메일 주소가 올바르게 입력되었는지 확인하세요</li>
                    <li>비밀번호를 정확하게 입력했는지 확인하세요 (대소문자 구분)</li>
                    <li>Caps Lock이 켜져 있는지 확인하세요</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signin"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                로그인 페이지로 돌아가기
              </Link>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                메인 페이지로 이동
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트에서는 Suspense로 감싸줍니다
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
} 