import { Metadata } from "next";
import GenerateRecommendationClient from "./GenerateRecommendationClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "학습 추천 생성 - 청해FLAME",
  description: "AI 기반 맞춤형 학습 추천을 생성합니다.",
};

export default function GenerateRecommendationPage() {
  return <GenerateRecommendationClient />;
} 