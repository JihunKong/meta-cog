"use client";

import Link from "next/link";
import { AdminCheck } from "@/components/admin/AdminCheck";
import UsersList from "@/components/admin/UsersList";

export default function UsersPage() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">사용자 관리</h1>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <span>대시보드로 돌아가기</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <UsersList showFilters={true} />
        </div>
      </div>
    </AdminCheck>
  );
} 