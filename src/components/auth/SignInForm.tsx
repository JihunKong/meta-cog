"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false
      });
      
      if (result?.error) {
        console.error("로그인 오류:", result.error);
        window.location.href = `/auth/signin?error=${result.error}`;
        return;
      }

      // 로그인 성공 후 세션 정보 직접 가져오기
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      
      if (session?.user?.role) {
        switch (session.user.role) {
          case "ADMIN":
            window.location.href = "/admin";
            break;
          case "TEACHER":
            window.location.href = "/teacher";
            break;
          default:
            window.location.href = "/dashboard";
        }
      } else {
        window.location.href = "/dashboard";
      }
      
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일 주소"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icons.spinner className="animate-spin mr-2 h-4 w-4" />
                로그인 중...
              </>
            ) : "로그인"}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>관리자가 발급한 계정으로 로그인하세요.</p>
          <p>계정이 없으시면 관리자에게 문의하세요.</p>
        </div>
      </div>
    </div>
  );
} 