import { Metadata } from "next";
import StudentsClient from "./StudentsClient";

export const metadata: Metadata = {
  title: "학생 목록 - 청해FLAME",
  description: "학생들의 학습 현황을 관리하고 조언을 제공합니다.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default function StudentsPage() {
  return <StudentsClient />;
} 