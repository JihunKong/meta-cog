"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChangePasswordForm() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    
    // 입력 검증
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error("새 비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "비밀번호 변경에 실패했습니다.");
      }
      
      // 폼 초기화
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      toast.success("비밀번호가 성공적으로 변경되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>비밀번호 변경</CardTitle>
        <CardDescription>
          안전한 비밀번호를 사용하여 계정을 보호하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="현재 비밀번호"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="새 비밀번호 (최소 6자)"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="새 비밀번호 확인"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                변경 중...
              </>
            ) : "비밀번호 변경"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 