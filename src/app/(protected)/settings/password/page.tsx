import { Metadata } from "next";
import ChangePasswordForm from "@/components/user/ChangePasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 변경 - 청해FLAME",
  description: "계정 비밀번호를 변경합니다.",
};

export default function PasswordSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">계정 설정</h1>
        <ChangePasswordForm />
      </div>
    </div>
  );
} 