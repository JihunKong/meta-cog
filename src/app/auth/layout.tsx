import { Metadata } from "next";
import AuthProvider from "./AuthProvider";

export const metadata: Metadata = {
  title: "로그인 - 청해FLAME",
  description: "청해FLAME에 로그인하세요.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
} 