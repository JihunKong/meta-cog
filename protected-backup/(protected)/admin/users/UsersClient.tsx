"use client";

import Link from "next/link";
import { AdminCheck } from "@/components/admin/AdminCheck";
import UsersList from "@/components/admin/UsersList";
import { Icons } from "@/components/ui/icons";

export default function UsersClient() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">사용자 관리</h1>
          <Link
            href="/admin"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Icons.chevronLeft className="mr-1 h-4 w-4" />
            대시보드로 돌아가기
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <UsersList showFilters />
        </div>
      </div>
    </AdminCheck>
  );
} 