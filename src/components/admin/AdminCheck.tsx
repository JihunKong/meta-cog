"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";

interface AdminCheckProps {
  children: ReactNode;
}

export function AdminCheck({ children }: AdminCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      toast.error("로그인이 필요합니다");
      router.push("/auth/login");
      return;
    }

    if (session.user.role !== "ADMIN") {
      toast.error("관리자 권한이 필요합니다");
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Icons.spinner className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Icons.warning className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">접근 권한이 없습니다</h2>
        <p className="text-gray-600 mb-4">이 페이지는 관리자만 접근할 수 있습니다.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return <>{children}</>;
} 