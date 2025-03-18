"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";
import { AIRecommendation } from "@/types";

export default function GenerateRecommendation() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  const handleGenerateRecommendations = async () => {
    try {
      setIsGenerating(true);
      setIsSuccess(false);
      
      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "추천 생성에 실패했습니다");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data || []);
        setIsSuccess(true);
        toast.success("AI 학습 추천이 생성되었습니다");
        console.log("생성된 추천:", data.data);
      } else {
        throw new Error(data.error?.message || "추천 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("추천 생성 오류:", error);
      toast.error(error instanceof Error ? error.message : "추천 생성 중 오류가 발생했습니다");
    } finally {
      setIsGenerating(false);
    }
  };

  const getRecommendationTypeText = (type: string) => {
    switch (type) {
      case "STRATEGY":
        return "학습 전략";
      case "SCHEDULE":
        return "학습 스케줄";
      case "SUBJECT":
        return "과목 추천";
      case "UNIT":
        return "단원 학습";
      default:
        return type;
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case "STRATEGY":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SCHEDULE":
        return "bg-green-100 text-green-800 border-green-200";
      case "SUBJECT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "UNIT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-100">
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white">
            <Icons.add className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-semibold text-indigo-800">Claude 3.7 Sonnet AI 추천 시스템</h2>
        </div>
        <p className="text-indigo-700 mb-2">
          이 시스템은 Anthropic의 Claude 3.7 Sonnet 모델을 사용하여 당신의 학습 데이터를 분석하고 
          개인화된 학습 추천을 제공합니다.
        </p>
        <ul className="space-y-1 text-sm text-indigo-600 ml-4 list-disc mb-3">
          <li>학습 계획, 과목 진도 및 학습 패턴 분석</li>
          <li>효과적인 학습 전략 및 스케줄 추천</li>
          <li>과목별 맞춤형 학습 조언</li>
          <li>중요 단원과 학습 우선순위 제안</li>
        </ul>
        <p className="text-xs text-indigo-500">
          이 기능은 API 호출을 통해 생성되며, 학습 데이터가 많을수록 더 정확한 추천이 제공됩니다.
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-md hover:from-indigo-700 hover:to-blue-600 shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <Icons.spinner className="h-5 w-5 animate-spin" />
              AI가 추천을 생성하는 중...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icons.add className="h-5 w-5" />
              AI 학습 추천 생성하기
            </span>
          )}
        </button>
        <p className="mt-2 text-sm text-gray-500">
          데이터 분석 및 추천 생성에 약 10-15초 정도 소요될 수 있습니다.
        </p>
      </div>

      {isGenerating && (
        <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.help className="h-8 w-8 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-indigo-700 font-medium">
            AI가 학습 데이터를 분석하고 있습니다...
          </p>
          <ul className="mt-2 space-y-1 text-sm text-indigo-600">
            <li>• 학습 계획 분석 중</li>
            <li>• 과목별 진도 확인 중</li>
            <li>• 맞춤형 추천 생성 중</li>
          </ul>
        </div>
      )}

      {isSuccess && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">생성된 AI 학습 추천</h3>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="border-b px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getRecommendationTypeColor(recommendation.type)}`}>
                        {getRecommendationTypeText(recommendation.type)}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {recommendation.subject}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(recommendation.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 whitespace-pre-line">
                      {recommendation.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 mb-4">
                학습 데이터가 충분하지 않아 맞춤형 추천을 생성할 수 없습니다.
              </p>
              <p className="text-sm text-gray-600">
                더 많은 학습 계획을 등록하고 진행 상황을 업데이트하면 개인화된 추천을 받을 수 있습니다.
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/recommendations")}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
            >
              모든 추천 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 