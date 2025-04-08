"use client";

import { useSession } from "next-auth/react";
import ChangePasswordForm from "@/components/user/ChangePasswordForm";

export default function PasswordClient() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">계정 설정</h1>
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">계정 설정</h1>
        <ChangePasswordForm />
      </div>
    </div>
  );
} 