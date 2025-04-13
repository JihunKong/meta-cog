"use client";

import LogsClient from "./LogsClient";


// 정적 생성 비활성화
export const dynamic = "force-dynamic";

export default function LogsPage() {
  return <LogsClient />;
} 