"use client";

import Link from "next/link";
import AdminStats from "@/components/admin/AdminStats";

export default function AdminClient() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
      </div>

      <AdminStats />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">사용자 관리</h2>
          <p className="text-gray-600 dark:text-gray-300">
            사용자 목록 조회 및 권한 관리
          </p>
        </Link>

        <Link
          href="/admin/subjects"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">과목 관리</h2>
          <p className="text-gray-600 dark:text-gray-300">
            과목 및 커리큘럼 관리
          </p>
        </Link>

        <Link
          href="/admin/data"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">데이터 관리</h2>
          <p className="text-gray-600 dark:text-gray-300">
            데이터 백업 및 복원
          </p>
        </Link>

        <Link
          href="/admin/logs"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">시스템 로그</h2>
          <p className="text-gray-600 dark:text-gray-300">
            시스템 로그 조회 및 분석
          </p>
        </Link>

        <Link
          href="/admin/recommendations"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">추천 관리</h2>
          <p className="text-gray-600 dark:text-gray-300">
            AI 추천 설정 및 관리
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">시스템 설정</h2>
          <p className="text-gray-600 dark:text-gray-300">
            시스템 환경 설정 관리
          </p>
        </Link>
      </div>
    </div>
  );
}
