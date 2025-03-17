"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInForm() {
  // useSearchParams를 사용하되, 항상 안전하게 처리
  const searchParams = useSearchParams?.() || null;
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const error = searchParams?.get("error") || null;
  
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
        callbackUrl,
        redirect: true
      });
      
      // 리디렉션이 자동으로 처리되므로 여기에 도달하지 않을 수 있음
      console.log("로그인 결과:", result);
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
    } finally {
      setLoading(false);
    }
  };

  // 오류 메시지 상세화
  const getErrorMessage = () => {
    if (!error) return null;
    
    console.log("로그인 오류 코드:", error);
    
    if (error === "CredentialsSignin") return "이메일 또는 비밀번호가 일치하지 않습니다.";
    if (error === "AccessDenied") return "접근이 거부되었습니다. 관리자에게 문의하세요.";
    if (error === "Configuration") return "서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.";
    return "로그인에 실패했습니다. 다시 시도하거나 관리자에게 문의하세요.";
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {getErrorMessage()}
        </div>
      )}
      
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