import { Metadata } from "next";
import StatsClient from "./StatsClient";

export const metadata: Metadata = {
  title: "교사 통계 - 청해FLAME",
  description: "교사 통계 관리 페이지",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default function StatsPage() {
  return <StatsClient />;
} 