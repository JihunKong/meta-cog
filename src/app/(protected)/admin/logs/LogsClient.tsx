"use client";

import { AdminCheck } from "@/components/admin/AdminCheck";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { useState } from "react";

export default function LogsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/logs");
      if (!response.ok) {
        throw new Error("로그를 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error("로그 가져오기 오류:", error);
      toast.error("로그를 가져오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm("정말로 모든 로그를 삭제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/logs", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("로그 삭제에 실패했습니다.");
      }

      setLogs([]);
      toast.success("로그가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("로그 삭제 오류:", error);
      toast.error("로그 삭제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">시스템 로그</h1>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  로딩 중...
                </>
              ) : (
                <>
                  <Icons.refresh className="mr-2 h-4 w-4" />
                  새로고침
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={clearLogs}
              disabled={isLoading}
            >
              <Icons.trash className="mr-2 h-4 w-4" />
              로그 삭제
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500">로그가 없습니다.</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700"
                >
                  <pre className="whitespace-pre-wrap text-sm">{log}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminCheck>
  );
} 