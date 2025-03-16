"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// 시스템 설정 인터페이스
interface SystemSettingsData {
  aiRecommendationEnabled: boolean;
  maxStudyPlansPerUser: number;
  maxCurriculumsPerUser: number;
  autoGenerateRecommendationsDaily: boolean;
  notificationsEnabled: boolean;
  maintenanceMode: boolean;
}

export default function SystemSettings() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettingsData>({
    aiRecommendationEnabled: true,
    maxStudyPlansPerUser: 10,
    maxCurriculumsPerUser: 5,
    autoGenerateRecommendationsDaily: true,
    notificationsEnabled: true,
    maintenanceMode: false,
  });

  // 설정 변경 핸들러
  const handleSettingChange = (key: keyof SystemSettingsData, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 설정 저장 핸들러
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // 여기에 API 호출 코드가 들어갈 예정입니다.
      // 현재는 시뮬레이션만 합니다.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("시스템 설정이 성공적으로 저장되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("설정 저장 오류:", error);
      toast.error("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">일반 설정</TabsTrigger>
        <TabsTrigger value="ai">AI 설정</TabsTrigger>
        <TabsTrigger value="system">시스템 관리</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>일반 설정</CardTitle>
            <CardDescription>
              시스템의 기본 동작을 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notificationsEnabled">알림 활성화</Label>
                <Switch
                  id="notificationsEnabled"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked: boolean) => 
                    handleSettingChange("notificationsEnabled", checked)
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                사용자에게 이메일 및 시스템 알림을 보냅니다.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxStudyPlansPerUser">사용자당 최대 학습 계획 수</Label>
              <Input
                id="maxStudyPlansPerUser"
                type="number"
                value={settings.maxStudyPlansPerUser}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleSettingChange("maxStudyPlansPerUser", parseInt(e.target.value))
                }
              />
              <p className="text-sm text-muted-foreground">
                한 사용자가 생성할 수 있는 최대 학습 계획 수를 설정합니다.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxCurriculumsPerUser">사용자당 최대 커리큘럼 수</Label>
              <Input
                id="maxCurriculumsPerUser"
                type="number"
                value={settings.maxCurriculumsPerUser}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleSettingChange("maxCurriculumsPerUser", parseInt(e.target.value))
                }
              />
              <p className="text-sm text-muted-foreground">
                한 사용자가 생성할 수 있는 최대 커리큘럼 수를 설정합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="ai" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>AI 설정</CardTitle>
            <CardDescription>
              AI 추천 시스템 설정을 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="aiRecommendationEnabled">AI 추천 활성화</Label>
                <Switch
                  id="aiRecommendationEnabled"
                  checked={settings.aiRecommendationEnabled}
                  onCheckedChange={(checked: boolean) => 
                    handleSettingChange("aiRecommendationEnabled", checked)
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                AI 추천 기능을 활성화하거나 비활성화합니다.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoGenerateRecommendationsDaily">일일 자동 추천 생성</Label>
                <Switch
                  id="autoGenerateRecommendationsDaily"
                  checked={settings.autoGenerateRecommendationsDaily}
                  onCheckedChange={(checked: boolean) => 
                    handleSettingChange("autoGenerateRecommendationsDaily", checked)
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                매일 자동으로 학생들에게 AI 추천을 생성합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="system" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>시스템 관리</CardTitle>
            <CardDescription>
              시스템 유지 관리 설정을 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenanceMode" className="text-red-500 dark:text-red-400">유지 보수 모드</Label>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked: boolean) => 
                    handleSettingChange("maintenanceMode", checked)
                  }
                />
              </div>
              <p className="text-sm text-red-500 dark:text-red-400">
                유지 보수 모드를 활성화하면 관리자를 제외한 모든 사용자가 시스템에 접근할 수 없습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Icons.settings className="mr-2 h-4 w-4" />
              설정 저장
            </>
          )}
        </Button>
      </div>
    </Tabs>
  );
} 