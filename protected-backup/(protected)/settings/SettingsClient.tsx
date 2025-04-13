"use client";

import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export default function SettingsClient() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">계정 설정</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/settings/password"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <Icons.settings className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">비밀번호 변경</h2>
            </div>
            <p className="text-gray-600">
              계정 비밀번호를 변경하여 보안을 강화하세요.
            </p>
          </Link>
          
          <Link
            href="/dashboard"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <Icons.chart className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">대시보드로 돌아가기</h2>
            </div>
            <p className="text-gray-600">
              학습 현황과 계획을 확인하세요.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
} 