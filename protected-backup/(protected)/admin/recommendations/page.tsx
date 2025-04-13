"use client";

import RecommendationsClient from "./RecommendationsClient";


// 동적 라우팅 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RecommendationsPage() {
  return <RecommendationsClient />;
} 