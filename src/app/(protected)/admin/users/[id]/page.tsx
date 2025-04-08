import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentDetailView } from "@/components/admin/StudentDetailView";

export const metadata: Metadata = {
  title: "학생 상세 정보 - 청해FLAME",
  description: "학생의 학습 현황과 진도를 확인합니다.",
};

// Next.js 15에 맞게 타입 정의 수정
type Props = {
  params: {
    id: string;
  };
};

export default function StudentDetailPage({ params }: Props) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학생 상세 정보</h1>
        <Link
          href="/admin/users"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
        >
          <span>학생 목록으로 돌아가기</span>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        <StudentDetailView studentId={params.id} />
      </div>
    </div>
  );
}

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [
    { id: "fallback" },
  ];
} 