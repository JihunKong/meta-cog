"use client";

import { useSession } from "next-auth/react";

export default function RoleDebug() {
  const { data: session, status } = useSession();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg text-xs z-50">
      <p>상태: {status}</p>
      <p>이름: {session?.user?.name || '없음'}</p>
      <p>이메일: {session?.user?.email || '없음'}</p>
      <p>역할: {session?.user?.role || '없음'}</p>
    </div>
  );
} 