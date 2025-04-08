"use client";

import { useSession } from "next-auth/react";
import SubjectsList from "@/components/admin/SubjectsList";
import { AdminCheck } from "@/components/admin/AdminCheck";

export default function SubjectsClient() {
  const { data: session } = useSession();

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