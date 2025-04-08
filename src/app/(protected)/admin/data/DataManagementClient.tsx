"use client";

import { useState } from "react";
import { AdminCheck } from "@/components/admin/AdminCheck";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DataManagementClient() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleInitialize = async () => {
    if (!confirm("정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setIsInitializing(true);
    try {
      const response = await fetch("/api/admin/initialize", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("데이터 초기화 중 오류가 발생했습니다.");
      }

      toast.success("데이터가 성공적으로 초기화되었습니다.");
    } catch (error) {
      console.error("데이터 초기화 오류:", error);
      toast.error("데이터 초기화 중 오류가 발생했습니다.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch("/api/admin/backup");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "백업 중 오류가 발생했습니다.");
      }

      // Create a blob and download it
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("데이터가 성공적으로 백업되었습니다.");
    } catch (error) {
      console.error("백업 오류:", error);
      toast.error("백업 중 오류가 발생했습니다.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("정말로 백업 파일을 복원하시겠습니까? 현재 데이터는 모두 삭제됩니다.")) {
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/restore", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("복원 중 오류가 발생했습니다.");
      }

      toast.success("데이터가 성공적으로 복원되었습니다.");
    } catch (error) {
      console.error("복원 오류:", error);
      toast.error("복원 중 오류가 발생했습니다.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">데이터 관리</h1>
        </div>

        <Tabs defaultValue="initialize" className="w-full">
          <TabsList>
            <TabsTrigger value="initialize">데이터 초기화</TabsTrigger>
            <TabsTrigger value="backup">데이터 백업</TabsTrigger>
            <TabsTrigger value="restore">데이터 복원</TabsTrigger>
          </TabsList>

          <TabsContent value="initialize" className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800">데이터 초기화</h3>
              <p className="text-sm text-red-600 mt-1">
                모든 데이터를 초기화합니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={handleInitialize}
                disabled={isInitializing}
              >
                {isInitializing ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    초기화 중...
                  </>
                ) : (
                  "데이터 초기화"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">데이터 백업</h3>
              <p className="text-sm text-blue-600 mt-1">
                현재 데이터베이스의 모든 데이터를 JSON 파일로 백업합니다.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleBackup}
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    백업 중...
                  </>
                ) : (
                  "데이터 백업"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="restore" className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">데이터 복원</h3>
              <p className="text-sm text-green-600 mt-1">
                백업 파일에서 데이터를 복원합니다. 현재 데이터는 모두 삭제됩니다.
              </p>
              <div className="mt-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  id="restore-file"
                  disabled={isRestoring}
                />
                <label htmlFor="restore-file">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isRestoring}
                    asChild
                  >
                    <span>
                      {isRestoring ? (
                        <>
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          복원 중...
                        </>
                      ) : (
                        "백업 파일 선택"
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminCheck>
  );
} 