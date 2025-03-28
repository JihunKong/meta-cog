import { Metadata } from "next";
import { AdminCheck } from "@/components/admin/AdminCheck";
import SubjectsList from "@/components/admin/SubjectsList";

export const metadata: Metadata = {
  title: "과목 관리 - 청해FLAME",
  description: "과목 목록 및 관리 페이지입니다.",
};

export default function SubjectsPage() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">과목 관리</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <SubjectsList />
        </div>
      </div>
    </AdminCheck>
  );
} 