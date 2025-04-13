"use client";

// 정적 생성 비활성화
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function DebugSessionPage() {
  const { data: session, status } = useSession({ required: false });
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!session?.user?.email) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/debug/user?email=${encodeURIComponent(session.user.email)}`);
        
        if (!response.ok) {
          throw new Error("사용자 데이터를 가져오는데 실패했습니다.");
        }
        
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [session]);

  if (status === "loading") {
    return <div className="p-8">세션 정보를 로딩 중입니다...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">세션 디버그 페이지</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-xl font-bold mb-2">세션 정보</h2>
        <pre className="bg-white p-4 rounded border overflow-auto dark:bg-gray-900 dark:border-gray-700">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      {loading ? (
        <div>사용자 데이터를 불러오는 중...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : userData ? (
        <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-2">데이터베이스 사용자 정보</h2>
          <pre className="bg-white p-4 rounded border overflow-auto dark:bg-gray-900 dark:border-gray-700">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
} 