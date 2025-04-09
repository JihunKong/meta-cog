"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  type: string;
  subject: string;
  prompt: string;
}

export default function GenerateRecommendation() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: "",
    subject: "",
    prompt: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.type || !formData.subject) {
      toast.error("모든 필수 항목을 입력해주세요.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/recommendations/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("AI 추천 생성에 실패했습니다.");
      }
      
      const data = await response.json();
      
      toast.success("AI 추천이 성공적으로 생성되었습니다.");
      router.push("/admin/recommendations");
    } catch (error) {
      console.error("Error generating recommendation:", error);
      toast.error("AI 추천 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI 추천 생성</CardTitle>
        <CardDescription>
          AI가 맞춤형 추천을 생성합니다. 원하는 정보를 입력하세요.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">추천 유형</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange("type", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="추천 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRATEGY">학습 전략</SelectItem>
                <SelectItem value="SCHEDULE">학습 일정</SelectItem>
                <SelectItem value="SUBJECT">과목 추천</SelectItem>
                <SelectItem value="UNIT">단원 학습</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">과목</Label>
            <Select
              value={formData.subject}
              onValueChange={(value) => handleSelectChange("subject", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="과목 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="국어">국어</SelectItem>
                <SelectItem value="영어">영어</SelectItem>
                <SelectItem value="수학">수학</SelectItem>
                <SelectItem value="사회">사회</SelectItem>
                <SelectItem value="과학">과학</SelectItem>
                <SelectItem value="전체">전체 과목</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">추가 요청 사항 (선택)</Label>
            <Textarea
              id="prompt"
              name="prompt"
              placeholder="AI에게 구체적인 지침을 제공하세요..."
              value={formData.prompt}
              onChange={handleChange}
              rows={5}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/recommendations")}
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "생성 중..." : "AI 추천 생성"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 