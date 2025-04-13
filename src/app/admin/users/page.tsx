"use client";

import UsersClient from "./UsersClient";

// 정적 생성 완전 비활성화
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function UsersPage() {
  return <UsersClient />;
}
