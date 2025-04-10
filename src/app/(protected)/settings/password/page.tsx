import { Metadata } from "next";
import PasswordClient from "./PasswordClient";

export const metadata: Metadata = {
  title: "비밀번호 변경 - 청해FLAME",
  description: "계정 비밀번호를 변경합니다.",
};

export default function PasswordSettingsPage() {
  return <PasswordClient />;
} 