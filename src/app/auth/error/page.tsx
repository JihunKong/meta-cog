import { Metadata } from "next";
import ErrorClient from "./ErrorClient";

export const metadata: Metadata = {
  title: "인증 오류 - 청해FLAME",
  description: "로그인 중 문제가 발생했습니다.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default function AuthErrorPage() {
  return <ErrorClient />;
} 