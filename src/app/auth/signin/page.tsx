import { Metadata } from "next";
import SignInClient from "./SignInClient";

export const metadata = {
  title: "로그인 - 청해FLAME",
  description: "청해FLAME 시스템에 로그인하세요.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default function SignInPage() {
  return <SignInClient />;
} 