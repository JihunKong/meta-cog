"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";

// 로그 항목 인터페이스
interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
  source: string;
  details?: string;
}

export default function SystemLogs() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [logLevel, setLogLevel] = useState<"all" | "info" | "warning" | "error">("all");

  // 로그 데이터 가져오기 (시뮬레이션)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        
        // 실제 API 호출 대신 시뮬레이션 데이터 사용
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const mockLogs: LogEntry[] = [
          {
            id: "1",
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
            level: "info",
            message: "사용자 로그인",
            source: "auth",
            details: "사용자 ID: user123"
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
            level: "warning",
            message: "API 응답 지연",
            source: "api",
            details: "엔드포인트: /api/users, 응답 시간: 3.5초"
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            level: "error",
            message: "데이터베이스 연결 실패",
            source: "database",
            details: "연결 시간 초과"
          },
          {
            id: "4",
            timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
            level: "info",
            message: "시스템 시작",
            source: "system",
            details: "버전: 1.0.0"
          },
          {
            id: "5",
            timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
            level: "info",
            message: "AI 추천 생성 완료",
            source: "ai",
            details: "생성된 추천: 25개"
          },
          {
            id: "6",
            timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
            level: "warning",
            message: "메모리 사용량 높음",
            source: "system",
            details: "사용량: 85%"
          },
          {
            id: "7",
            timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
            level: "error",
            message: "API 요청 실패",
            source: "api",
            details: "엔드포인트: /api/recommendations, 상태 코드: 500"
          }
        ];
        
        setLogs(mockLogs);
        setFilteredLogs(mockLogs);
      } catch (error) {
        console.error("로그 가져오기 오류:", error);
        toast.error("로그를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  // 검색어와 로그 레벨에 따라 로그 필터링
  useEffect(() => {
    let filtered = logs;
    
    // 로그 레벨로 필터링
    if (logLevel !== "all") {
      filtered = filtered.filter(log => log.level === logLevel);
    }
    
    // 검색어로 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) || 
        log.source.toLowerCase().includes(term) || 
        (log.details && log.details.toLowerCase().includes(term))
      );
    }
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, logLevel]);

  // 로그 레벨에 따른 배지 스타일
  const getLevelBadgeClass = (level: "info" | "warning" | "error") => {
    switch (level) {
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // 로그 내보내기
  const handleExportLogs = () => {
    try {
      const jsonString = JSON.stringify(logs, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `system-logs-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("로그가 성공적으로 내보내졌습니다.");
    } catch (error) {
      console.error("로그 내보내기 오류:", error);
      toast.error("로그를 내보내는 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="w-full md:w-1/2">
          <Label htmlFor="search" className="sr-only">검색</Label>
          <Input
            id="search"
            placeholder="로그 검색..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <Tabs 
            value={logLevel} 
            onValueChange={(value) => setLogLevel(value as "all" | "info" | "warning" | "error")}
            className="w-full md:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="info">정보</TabsTrigger>
              <TabsTrigger value="warning">경고</TabsTrigger>
              <TabsTrigger value="error">오류</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            onClick={handleExportLogs}
            disabled={logs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">로그를 불러오는 중...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          표시할 로그가 없습니다.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">시간</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">레벨</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">소스</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">메시지</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">상세 정보</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="bg-card hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeClass(log.level)}`}>
                        {log.level === "info" ? "정보" : log.level === "warning" ? "경고" : "오류"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{log.source}</td>
                    <td className="px-4 py-3 text-sm">{log.message}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.details || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 