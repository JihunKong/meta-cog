import { Metadata } from "next";
import LogsClient from "./LogsClient";

export const metadata: Metadata = {
  title: "시스템 로그 - 청해FLAME",
  description: "시스템 로그를 확인합니다.",
};

export default function LogsPage() {
  return <LogsClient />;
} 