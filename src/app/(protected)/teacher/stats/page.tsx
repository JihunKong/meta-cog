import { Metadata } from "next";
import StatsClient from "./StatsClient";

export const metadata: Metadata = {
  title: "교사 통계",
  description: "교사용 통계 대시보드",
};

export default function StatsPage() {
  return <StatsClient />;
} 