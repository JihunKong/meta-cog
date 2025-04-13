import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "STUDENT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "회원가입에 실패했습니다.");
      }

      toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
      router.push("/auth/signin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          name="name"
          placeholder="홍길동"
          type="text"
          autoCapitalize="none"
          autoComplete="name"
          autoCorrect="off"
          disabled={isLoading}
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          placeholder="name@example.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          disabled={isLoading}
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          placeholder="••••••••"
          type="password"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect="off"
          disabled={isLoading}
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">계정 유형</Label>
        <Select
          name="role"
          value={formData.role}
          onValueChange={handleRoleChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="계정 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEACHER">교사</SelectItem>
            <SelectItem value="STUDENT">학생</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button disabled={isLoading} type="submit" className="w-full">
        {isLoading && (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        )}
        회원가입
      </Button>
    </form>
  );
} 