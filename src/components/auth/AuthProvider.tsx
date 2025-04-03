"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";

export function SessionDebugger() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("현재 세션 상태:", status);
    console.log("세션 데이터:", session);
  }, [session, status]);

  return null; // UI에 표시되지 않는 컴포넌트
}

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <SessionDebugger />
      {children}
    </SessionProvider>
  );
} 