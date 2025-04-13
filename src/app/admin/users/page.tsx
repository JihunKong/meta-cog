"use client";

import UsersClient from "./UsersClient";

// 정적 생성 비활성화
export const dynamic = "force-dynamic";

export default function UsersPage() {
  return <UsersClient />;
}
