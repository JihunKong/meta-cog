"use client";

import ChangePasswordForm from "@/components/user/ChangePasswordForm";

export default function PasswordClient() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">계정 설정</h1>
        <ChangePasswordForm />
      </div>
    </div>
  );
} 