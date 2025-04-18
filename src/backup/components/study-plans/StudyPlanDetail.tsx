"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { apiCall } from "@/lib/api-service";

interface StudyPlanDetailProps {
  id: string;
}

interface StudyPlan {
  id: string;
  date: string;
  subject: string;
  content: string;
  targetAchievement?: number; // 목표 달성률(%)
  achievement: number; // 달성률(%)
  createdAt: string;
  updatedAt: string;
  timeSlot?: string;
}

// 달성률 옵션을 10% 단위로 세분화
const ACHIEVEMENT_OPTIONS = [
  { value: 0, label: "0% - 전혀 하지 못했어요" },
  { value: 10, label: "10% - 아주 조금 했어요" },
  { value: 20, label: "20% - 시작해보았어요" },
  { value: 30, label: "30% - 조금 진행했어요" },
  { value: 40, label: "40% - 절반을 향해 가고 있어요" },
  { value: 50, label: "50% - 절반을 했어요" },
  { value: 60, label: "60% - 절반을 넘었어요" },
  { value: 70, label: "70% - 많이 진행했어요" },
  { value: 80, label: "80% - 거의 다 했어요" },
  { value: 90, label: "90% - 마무리 단계예요" },
  { value: 100, label: "100% - 완벽하게 마쳤어요!" },
];

// CustomSelect 컴포넌트 추가
function CustomSelect({ 
  value, 
  options, 
  onChange, 
  label 
}: { 
  value: number, 
  options: { value: number, label: string }[], 
  onChange: (value: number) => void,
  label: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 현재 선택된 옵션의 레이블 찾기
  const selectedOption = options.find(option => option.value === value);
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 text-left border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center"
      >
        <span>{selectedOption?.label || '선택하세요'}</span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${value === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 시간대 정의
const TIME_SLOTS = [
  { id: "19-20:15", label: "19시 00분~20시 15분" },
  { id: "20:35-21:50", label: "20시 35분~21시 50분" },
];

// 과목 목록 정의 (추가)
const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function StudyPlanDetail({ id }: StudyPlanDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [achievementPercent, setAchievementPercent] = useState<number>(0);

  useEffect(() => {
    async function fetchStudyPlan() {
      try {
        const result = await apiCall<{success: boolean, data: StudyPlan}>(`/api/study-plans/${id}`);
        console.log("받은 학습 계획 데이터:", result);
        
        if (result.success && result.data) {
          const data = result.data;
          setStudyPlan(data);
          
          // achievement를 메타인지 척도(0-100%)로 직접 해석
          const achievementValue = data.achievement || 0;
          setAchievementPercent(achievementValue);
        } else {
          throw new Error("학습 계획 데이터 형식이 올바르지 않습니다.");
        }
      } catch (error) {
        console.error("학습 계획 불러오기 오류:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("학습 계획을 불러오는데 문제가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStudyPlan();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 이 학습 계획을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await apiCall(`/api/study-plans/${id}`, { method: "DELETE" });
      
      toast.success("학습 계획이 삭제되었습니다.");
      router.push("/study-plans");
    } catch (error) {
      console.error("학습 계획 삭제 오류:", error);
      toast.error("학습 계획을 삭제하는데 문제가 발생했습니다.");
    }
  };

  const handleSaveAchievement = async () => {
    if (!studyPlan) return;
    
    // 메타인지 달성률 값을 그대로 저장 (퍼센트 값)
    console.log("저장할 데이터:", {
      studyPlanId: id,
      achievement: achievementPercent
    });
    
    setSaving(true);
    
    try {
      const result = await apiCall<{success: boolean, data: StudyPlan}>(`/api/study-plans/${id}`, {
        method: "PATCH",
        body: {
          achievement: achievementPercent,
        }
      });
      
      if (result.success) {
        toast.success("학습 달성률이 업데이트되었습니다.");
        setStudyPlan(result.data);
        setIsEditing(false);
      } else {
        throw new Error("업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("학습 달성률 업데이트 오류:", error);
      toast.error("학습 달성률을 저장하는데 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "날짜 정보 없음";
      
      // 날짜 문자열에서 시간 부분 제거 (YYYY-MM-DD 형식 처리)
      const datePart = dateString.split('T')[0];
      
      // 날짜가 유효한지 확인
      const date = new Date(datePart);
      if (isNaN(date.getTime())) {
        console.error("잘못된 날짜 형식:", dateString);
        return "잘못된 날짜 형식";
      }
      
      // 한국어 로케일로 날짜 포맷팅
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      });
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return "날짜 처리 오류";
    }
  };
  
  // 달성률 얻기 (메타인지 척도)
  const getAchievementRate = () => {
    if (!studyPlan) return 0;
    return studyPlan.achievement || 0;
  };

  // 시간대 ID를 사용자 친화적인 레이블로 변환하는 함수
  const getTimeSlotLabel = (timeSlotId: string) => {
    if (!timeSlotId) return "시간 정보 없음";
    
    const timeSlot = TIME_SLOTS.find(slot => slot.id === timeSlotId);
    return timeSlot ? timeSlot.label : timeSlotId;
  };

  // 학습 계획 날짜와 현재 날짜를 비교하여 진도율 업데이트 가능 여부 확인
  const canUpdateAchievement = () => {
    // 항상 업데이트 가능하도록 true 반환 (필요한 경우 제한 로직 추가)
    return true;
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  if (!studyPlan) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">학습 계획을 찾을 수 없습니다.</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700">기본 정보</h3>
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-gray-500">날짜 및 시간</p>
                <p className="font-medium">
                  {formatDate(studyPlan.date)} - {getTimeSlotLabel(studyPlan.timeSlot || "")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">과목</p>
                <p className="font-medium">{studyPlan.subject}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">현재 달성률</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        getAchievementRate() >= 100
                          ? "bg-green-500"
                          : getAchievementRate() >= 75
                          ? "bg-blue-500"
                          : getAchievementRate() >= 50
                          ? "bg-indigo-500" 
                          : getAchievementRate() >= 25
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                      }`}
                      style={{ width: `${getAchievementRate()}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{getAchievementRate()}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">생성일</p>
                <p className="font-medium">{formatDate(studyPlan.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">최종 수정일</p>
                <p className="font-medium">{formatDate(studyPlan.updatedAt)}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <button
              onClick={() => router.back()}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              뒤로 가기
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              삭제하기
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700">학습 내용</h3>
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-wrap">{studyPlan.content}</p>
          </div>
        </div>
      </div>

      {!isEditing ? (
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">학습 결과</h3>
            {canUpdateAchievement() && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                업데이트
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">달성률</p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      getAchievementRate() >= 100
                        ? "bg-green-500"
                        : getAchievementRate() >= 75
                        ? "bg-blue-500"
                        : getAchievementRate() >= 50
                        ? "bg-indigo-500"
                        : getAchievementRate() >= 25
                        ? "bg-yellow-500"
                        : "bg-gray-300"
                    }`}
                    style={{ width: `${getAchievementRate()}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{getAchievementRate()}%</span>
              </div>
            </div>

            {getAchievementRate() === 0 && (
              <div className="text-center text-gray-500 py-2">
                아직 학습 결과가 업데이트되지 않았습니다.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-700 mb-4">학습 결과 업데이트</h3>
          <div className="space-y-6">
            <div>
              <label htmlFor="achievement" className="block text-sm font-medium text-gray-700 mb-1">
                학습 달성률
              </label>
              <CustomSelect
                value={achievementPercent}
                options={ACHIEVEMENT_OPTIONS}
                onChange={(value) => setAchievementPercent(value)}
                label="달성률"
              />
              <p className="mt-1 text-sm text-gray-500">
                메타인지 학습 진행도: {achievementPercent}%
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAchievement}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 