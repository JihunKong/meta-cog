"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";

export default function DataManagement() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);

  const handleInitializeData = async () => {
    if (!confirm("정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      setIsInitializing(true);
      const response = await fetch("/api/admin/data/initialize", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`초기화 실패: ${data.error || '알 수 없는 오류'}`);
        throw new Error(data.error || "데이터 초기화 중 오류가 발생했습니다.");
      }

      toast.success("데이터가 성공적으로 초기화되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("데이터 초기화 오류:", error);
      toast.error(`데이터 초기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleBackupData = async () => {
    try {
      setIsBackingUp(true);
      const response = await fetch("/api/admin/data/backup", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("데이터 백업 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      
      // 백업 데이터를 JSON 파일로 다운로드
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `metacog-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("데이터가 성공적으로 백업되었습니다.");
    } catch (error) {
      console.error("데이터 백업 오류:", error);
      toast.error("데이터 백업 중 오류가 발생했습니다.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreData = async () => {
    if (!backupFile) {
      toast.error("복원할 백업 파일을 선택해주세요.");
      return;
    }

    if (!confirm("정말로 데이터를 복원하시겠습니까? 현재 데이터가 백업 파일의 데이터로 대체됩니다.")) {
      return;
    }

    try {
      setIsRestoring(true);
      
      const formData = new FormData();
      formData.append("backupFile", backupFile);
      
      const response = await fetch("/api/admin/data/restore", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("데이터 복원 중 오류가 발생했습니다.");
      }

      toast.success("데이터가 성공적으로 복원되었습니다.");
      setBackupFile(null);
      router.refresh();
    } catch (error) {
      console.error("데이터 복원 오류:", error);
      toast.error("데이터 복원 중 오류가 발생했습니다.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupFile(e.target.files[0]);
    }
  };

  return (
    <Tabs defaultValue="initialize" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="initialize">데이터 초기화</TabsTrigger>
        <TabsTrigger value="backup">데이터 백업</TabsTrigger>
        <TabsTrigger value="restore">데이터 복원</TabsTrigger>
      </TabsList>
      
      <TabsContent value="initialize" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>데이터 초기화</CardTitle>
            <CardDescription>
              모든 시스템 데이터를 초기 상태로 되돌립니다. 이 작업은 되돌릴 수 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500 dark:text-red-400 mb-4">
              경고: 이 작업은 모든 사용자 데이터, 학습 계획, 커리큘럼 및 AI 추천 데이터를 삭제합니다.
              진행하기 전에 데이터를 백업하는 것을 강력히 권장합니다.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={handleInitializeData}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  초기화 중...
                </>
              ) : (
                <>
                  <Icons.trash className="mr-2 h-4 w-4" />
                  데이터 초기화
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="backup" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>데이터 백업</CardTitle>
            <CardDescription>
              현재 시스템의 모든 데이터를 JSON 파일로 백업합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              백업 파일에는 사용자 정보, 학습 계획, 커리큘럼 및 AI 추천 데이터가 포함됩니다.
              이 파일은 나중에 시스템을 복원하는 데 사용할 수 있습니다.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleBackupData}
              disabled={isBackingUp}
            >
              {isBackingUp ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  백업 중...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  데이터 백업
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="restore" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>데이터 복원</CardTitle>
            <CardDescription>
              백업 파일에서 시스템 데이터를 복원합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-500 dark:text-amber-400 mb-4">
              주의: 이 작업은 현재 시스템의 데이터를 백업 파일의 데이터로 대체합니다.
              진행하기 전에 현재 데이터를 백업하는 것을 권장합니다.
            </p>
            
            <div className="mt-4">
              <label htmlFor="backupFile" className="block text-sm font-medium mb-2">
                백업 파일 선택
              </label>
              <input
                type="file"
                id="backupFile"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90
                  dark:text-gray-400"
              />
              {backupFile && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  선택된 파일: {backupFile.name}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              onClick={handleRestoreData}
              disabled={isRestoring || !backupFile}
            >
              {isRestoring ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  복원 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  데이터 복원
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 