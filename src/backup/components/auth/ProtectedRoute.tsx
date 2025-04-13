"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  requiredRoles = ["STUDENT", "TEACHER", "ADMIN"], // 기본적으로 모든 인증된 사용자 허용
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  
  useEffect(() => {
    // 상태 로깅
    console.log("[ProtectedRoute] 페이지:", pathname);
    console.log("[ProtectedRoute] 인증 상태:", status);
    console.log("[ProtectedRoute] 사용자 정보:", session?.user);
    console.log("[ProtectedRoute] 필요 권한:", requiredRoles);
    
    // 인증 확인 중인 경우
    if (status === "loading") {
      return;
    }
    
    // 인증되지 않은 경우
    if (status !== "authenticated" || !session?.user) {
      console.log("[ProtectedRoute] 인증되지 않음, 로그인 페이지로 이동");
      router.push("/auth/signin");
      return;
    }
    
    // 사용자의 역할이 있는지 확인
    if (!session.user.role) {
      console.error("[ProtectedRoute] 사용자 역할 정보 없음");
      router.push("/auth/signin?error=역할 정보가 없습니다");
      return;
    }
    
    // 역할 기반 액세스 제어
    const hasRequiredRole = requiredRoles.includes(session.user.role);
    console.log("[ProtectedRoute] 권한 확인 결과:", hasRequiredRole);
    
    if (!hasRequiredRole) {
      console.log("[ProtectedRoute] 권한 없음, 접근 거부");
      // 권한이 없는 경우 접근 거부 페이지로 이동하는 대신 대시보드에 그대로 남겨둡니다.
      // 관리자는 모든 페이지에 접근 가능하도록 설정
      if (session.user.role === "ADMIN") {
        console.log("[ProtectedRoute] 관리자 계정 - 접근 허용");
        setAuthorized(true);
        return;
      }
      
      // 권한 없음 알림
      alert("접근 권한이 없습니다.");
      router.push("/dashboard");
      return;
    }
    
    // 모든 검사 통과
    setAuthorized(true);
    
  }, [status, session, router, pathname, requiredRoles]);
  
  // 인증 확인 중이거나 권한 없는 경우
  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }
  
  // 인증 및 권한 확인 완료
  return <>{children}</>;
} 