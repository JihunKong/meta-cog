"use client";

import Link from "next/link";
import { TeacherCheck } from "@/components/teacher/TeacherCheck";
import { Icons } from "@/components/ui/icons";


export default function TeacherDashboardPage() {
  return (
    <TeacherCheck>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">교사 대시보드</h1>
        </div>

        {/* 요약 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">총 학생 수</h2>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                  학생 관리 페이지에서 확인
                </p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                <Icons.user className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href="/teacher/students" 
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                학생 목록 보기
                <Icons.chevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">전체 평균 달성률</h2>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  통계 페이지에서 확인
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Icons.pieChart className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href="/teacher/stats" 
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                통계 보기
                <Icons.chevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">생성된 AI 추천</h2>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  학생별 상세에서 확인
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Icons.help className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href="/teacher/students" 
                className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
              >
                학생별 추천 보기
                <Icons.chevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 바로가기 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">빠른 메뉴</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/teacher/students"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mr-4">
                <Icons.user className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">학생 관리</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">학생들의 학습 계획 및 진도를 확인합니다</p>
              </div>
            </Link>
            
            <Link
              href="/teacher/stats"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mr-4">
                <Icons.pieChart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">학습 통계</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">학생들의 학습 통계 및 분석 데이터를 확인합니다</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </TeacherCheck>
  );
} 