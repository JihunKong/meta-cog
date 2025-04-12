import { Metadata } from "next";
import StudentsClient from "./StudentsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata = {
  title: "학생 관리 - 청해FLAME",
  description: "담당 학생들의 학습 현황을 관리하고 분석합니다."
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  if (session.user.role !== "TEACHER") {
    redirect("/");
  }
  
  // next-auth의 SessionProvider가 필요하지 않도록 구성
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학생 목록</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        <StudentsClient user={session.user} />
      </div>
    </div>
  );
} 