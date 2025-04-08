import { Metadata } from "next";
import PasswordClient from "./PasswordClient";

export const metadata: Metadata = {
  title: "비밀번호 변경 - 청해FLAME",
  description: "계정 비밀번호를 변경합니다.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default function PasswordSettingsPage() {
  return <PasswordClient />;
} 