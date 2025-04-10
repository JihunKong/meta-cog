import { Metadata } from "next";
import RecommendationsClient from "./RecommendationsClient";

export const metadata: Metadata = {
  title: "AI 추천 관리 - 청해FLAME",
  description: "AI 추천 목록을 관리합니다."
};

// 동적 라우팅 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RecommendationsPage() {
  return <RecommendationsClient />;
} 