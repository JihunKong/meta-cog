"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";

interface TeacherCheckProps {
  children: React.ReactNode;
}

export function TeacherCheck({ children }: TeacherCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("TeacherCheck useEffect", status, session);
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user?.role !== "TEACHER" && session.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Icons.spinner className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg font-medium text-gray-800 dark:text-gray-200">권한을 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
} 