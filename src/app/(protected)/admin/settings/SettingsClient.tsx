"use client";

import SystemSettings from "@/components/admin/SystemSettings";

export default function SettingsClient() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">시스템 설정</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <SystemSettings />
      </div>
    </div>
  );
} 