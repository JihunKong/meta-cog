"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        console.log('대시보드 페이지 - 역할 확인 중...');
        const role = await getUserRole();
        console.log('대시보드 페이지 - 역할 확인 결과:', role);
        
        // getUserRole은 항상 소문자 역할을 반환합니다
        if (role === "student") router.replace("/dashboard/student");
        else if (role === "teacher") router.replace("/dashboard/teacher");
        else if (role === "admin") router.replace("/dashboard/admin");
        else {
          router.replace("/login");
        }
      } catch (error) {
        console.error('대시보드 역할 확인 오류:', error);
        router.replace("/login");
      }
    })();
  }, [router]);
  return null;
}