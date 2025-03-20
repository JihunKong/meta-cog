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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<any>(null);

  const handleGenerateRecommendations = async () => {
    try {
      setIsGenerating(true);
      setIsSuccess(false);
      setErrorDetails(null);
      setApiInfo(null);
      
      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
      });
      
      const responseText = await response.text();
      let data;
      
      try {
        // JSON 파싱 시도
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("응답 파싱 오류:", parseError);
        console.log("원본 응답:", responseText);
        throw new Error("서버 응답을 처리할 수 없습니다. 관리자에게 문의하세요.");
      }
      
      if (!response.ok) {
        let errorMessage = data.error?.message || "추천 생성에 실패했습니다";
        
        // API 키 관련 오류 메시지 추가
        if (responseText.includes("API 키가 설정되지 않았습니다") || 
            responseText.includes("ANTHROPIC_API_KEY")) {
          errorMessage = "AI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.";
          setErrorDetails("서버에 Claude API 키가 올바르게 설정되어 있지 않습니다.");
        }
        
        throw new Error(errorMessage);
      }
      
      if (data.success) {
        // 응답 형식 확인
        if (data.data.recommendations) {
          // 새로운 응답 형식 (추가 정보 포함)
          setRecommendations(data.data.recommendations || []);
          setApiInfo(data.data.info || null);
        } else {
          // 이전 응답 형식 (추천만 포함)
          setRecommendations(data.data || []);
        }
        
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
        return "bg-blue-100 text-blue-800";
      case "SCHEDULE":
        return "bg-green-100 text-green-800";
      case "SUBJECT":
        return "bg-purple-100 text-purple-800";
      case "UNIT":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">AI 학습 추천 생성</h1>
      
      <p className="text-gray-600 mb-8">
        학습 계획 데이터와 과목별 진도를 분석하여 개인화된 AI 학습 추천을 생성합니다.
        생성된 추천은 대시보드와 추천 목록에서 확인할 수 있습니다.
      </p>

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

      {errorDetails && (
        <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-red-700 font-medium">오류 세부 정보:</h3>
          <p className="text-red-600">{errorDetails}</p>
          <p className="text-sm mt-2 text-red-500">
            관리자는 서버에 .env.local 파일에 ANTHROPIC_API_KEY가 올바르게 설정되어 있는지 확인하세요.
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-lg border border-indigo-100 mt-6">
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

      {isSuccess && apiInfo && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
          <h4 className="font-medium text-blue-700">AI 분석 정보</h4>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex justify-between"><span>학습 계획 수:</span> <span className="font-medium">{apiInfo.studyPlansCount}</span></div>
            <div className="flex justify-between"><span>커리큘럼 진도 수:</span> <span className="font-medium">{apiInfo.progressCount}</span></div>
            <div className="flex justify-between"><span>생성된 추천 수:</span> <span className="font-medium">{apiInfo.generatedCount}</span></div>
            <div className="flex justify-between"><span>저장된 추천 수:</span> <span className="font-medium">{apiInfo.savedCount}</span></div>
          </div>
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
              <p className="text-gray-600">추천이 생성되지 않았습니다. 다시 시도해 주세요.</p>
            </div>
          )}
          
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/recommendations")}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              모든 추천 목록 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 