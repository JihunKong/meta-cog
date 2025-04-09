import { Metadata } from "next";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "인증 - 청해FLAME",
  description: "청해FLAME 인증 페이지",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
} 