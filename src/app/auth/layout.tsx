'use client';

import { SessionProvider } from "next-auth/react";

export async function generateMetadata() {
  return {
    title: "로그인 - 청해FLAME",
    description: "청해FLAME에 로그인하세요.",
  };
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 