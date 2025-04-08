"use client";

import { AdminCheck } from "@/components/admin/AdminCheck";
import SystemLogs from "@/components/admin/SystemLogs";

export default function LogsClient() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">시스템 로그</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <SystemLogs />
        </div>
      </div>
    </AdminCheck>
  );
} 