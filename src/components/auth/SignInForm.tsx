"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInFormProps {
  callbackUrl?: string;
}

export default function SignInForm({ callbackUrl = '/dashboard' }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // 테스트 계정 자동 입력 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setFormData({
        email: "admin@pof.com",
        password: "admin1234"
      });
    }
  }, []);

  // 로그인 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // 오류 메시지 초기화
    
    if (!formData.email || !formData.password) {
      setError("이메일과 비밀번호를 모두 입력해주세요");
      return;
    }
    
    try {
      setLoading(true);
      
      console.log("로그인 시도:", formData.email);
      
      // 테스트 관리자 계정 직접 처리
      if (formData.email === 'admin@pof.com' && formData.password === 'admin1234') {
        console.log('테스트 관리자 계정 직접 처리');
        
        // 직접 로그인 시도
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false
        });
        
        console.log('테스트 관리자 로그인 결과:', result);
        
        if (result?.error) {
          console.error('테스트 관리자 로그인 오류:', result.error);
          setError(result.error || '로그인에 실패했습니다');
        } else if (result?.ok) {
          console.log('테스트 관리자 로그인 성공, 관리자 대시보드로 이동');
          // 직접 관리자 대시보드로 리디렉션
          window.location.href = '/admin/dashboard';
          return;
        }
      } else {
        // 일반 사용자 로그인 처리
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false
        });
        
        console.log("로그인 결과:", result);
        
        if (result?.error) {
          console.error("로그인 오류:", result.error);
          setError(result.error || "로그인에 실패했습니다");
        } else if (result?.ok) {
          console.log("로그인 성공, 대시보드로 이동");
          // 직접 대시보드로 리디렉션
          window.location.href = '/dashboard';
        }
      }
      
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
      setError("로그인 처리 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 관리자 대시보드로 바로 이동
  const handleDirectAccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-gray-100 rounded-lg shadow-md border border-gray-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 오류 메시지 표시 영역 */}
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4 font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="block text-gray-900 font-bold">이메일</Label>
            <input
              id="email"
              type="email"
              placeholder="이메일 주소"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="block text-gray-900 font-bold">비밀번호</Label>
            <input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icons.spinner className="animate-spin inline-block mr-2 h-4 w-4" />
                로그인 중...
              </>
            ) : "로그인"}
          </button>

          {/* 개발 환경에서만 표시되는 직접 접근 버튼 */}
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={handleDirectAccess}
              className="w-full mt-4 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors"
            >
              관리자 대시보드로 바로 이동
            </button>
          )}
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-700 font-medium">
          <p>관리자가 발급한 계정으로 로그인하세요.</p>
          <p>계정이 없으시면 관리자에게 문의하세요.</p>
        </div>
      </div>
    </div>
  );
} 