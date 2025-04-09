"use client";

import dynamic from "next/dynamic";

// 클라이언트 컴포넌트에서는 dynamic 임포트와 ssr: false를 함께 사용할 수 있습니다
const RecommendationDetail = dynamic(
  () => import("@/components/recommendations/RecommendationDetail"),
  { ssr: false, loading: () => <div className="p-4 text-center">로딩 중...</div> }
);

interface RecommendationDetailWrapperProps {
  id: string;
}

export default function RecommendationDetailWrapper({ id }: RecommendationDetailWrapperProps) {
  return <RecommendationDetail id={id} />;
} 