import { Metadata } from "next";
import RecommendationsClient from "./RecommendationsClient";

export const metadata: Metadata = {
  title: "AI 추천 관리 - 청해FLAME",
  description: "AI 추천 목록을 관리합니다."
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default function RecommendationsPage() {
  return <RecommendationsClient />;
} 