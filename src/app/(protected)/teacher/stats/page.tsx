import { Metadata } from "next";
import StatsClient from "./StatsClient";

export const metadata: Metadata = {
  title: "교사 통계 - 청해FLAME",
  description: "교사 통계 관리 페이지",
};

export default function StatsPage() {
  return <StatsClient />;
} 