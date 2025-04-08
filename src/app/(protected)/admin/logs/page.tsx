import { Metadata } from "next";
import LogsClient from "./LogsClient";

export const metadata: Metadata = {
  title: "시스템 로그 - 청해FLAME",
  description: "시스템 로그 관리 페이지",
};

// 정적 생성 비활성화
export const dynamic = "force-dynamic";

export default function LogsPage() {
  return <LogsClient />;
} 