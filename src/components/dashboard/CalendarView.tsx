"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StudyPlan } from "@/types";
import { formatDate } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasStudyPlan: boolean;
  studyPlans: StudyPlan[];
}

export default function CalendarView() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // 현재 월의 캘린더 데이터 생성
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 현재 월의 첫 날
    const firstDayOfMonth = new Date(year, month, 1);
    // 현재 월의 마지막 날
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // 캘린더에 표시할 첫 날 (이전 월의 일부 날짜 포함)
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    firstDayOfCalendar.setDate(
      firstDayOfCalendar.getDate() - firstDayOfCalendar.getDay()
    );
    
    // 캘린더에 표시할 마지막 날 (다음 월의 일부 날짜 포함)
    const lastDayOfCalendar = new Date(lastDayOfMonth);
    const remainingDays = 6 - lastDayOfCalendar.getDay();
    lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + remainingDays);
    
    // 캘린더 데이터 생성
    const days: CalendarDay[] = [];
    const currentDay = new Date(firstDayOfCalendar);
    
    while (currentDay <= lastDayOfCalendar) {
      const isCurrentMonth = currentDay.getMonth() === month;
      const plansForDay = studyPlans.filter(
        (plan) => {
          const planDate = new Date(plan.date);
          return (
            planDate.getFullYear() === currentDay.getFullYear() &&
            planDate.getMonth() === currentDay.getMonth() &&
            planDate.getDate() === currentDay.getDate()
          );
        }
      );
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth,
        hasStudyPlan: plansForDay.length > 0,
        studyPlans: plansForDay,
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentDate, studyPlans]);

  // 학습 계획 데이터 가져오기
  useEffect(() => {
    const fetchStudyPlans = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/study-plans');
        
        if (!response.ok) {
          throw new Error("학습 계획을 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        if (data.success) {
          setStudyPlans(data.data);
        } else {
          throw new Error(data.error?.message || "학습 계획을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchStudyPlans();
  }, [session]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const openDayDetails = (day: CalendarDay) => {
    setSelectedDay(day);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Icons.spinner className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="text-gray-600 hover:text-gray-800"
        >
          <Icons.chevronLeft className="h-5 w-5" />
        </button>
        
        <h3 className="text-base font-medium">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="text-gray-600 hover:text-gray-800"
        >
          <Icons.chevronRight className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
        <div>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div>토</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isToday =
            day.date.getDate() === new Date().getDate() &&
            day.date.getMonth() === new Date().getMonth() &&
            day.date.getFullYear() === new Date().getFullYear();
          
          return (
            <button
              key={index}
              onClick={() => openDayDetails(day)}
              className={`h-9 text-xs rounded-md flex flex-col items-center justify-center ${
                day.isCurrentMonth
                  ? isToday
                    ? "bg-blue-100 text-blue-600 font-semibold"
                    : "bg-white hover:bg-gray-100"
                  : "text-gray-400 bg-gray-50"
              } ${day.hasStudyPlan ? "border-b-2 border-blue-500" : ""}`}
            >
              {day.date.getDate()}
              {day.hasStudyPlan && (
                <div className="w-1 h-1 mt-0.5 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
      
      {selectedDay && (
        <div className="mt-4 border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">
              {formatDate(selectedDay.date)} 학습 계획
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icons.close className="h-4 w-4" />
            </button>
          </div>
          
          {selectedDay.studyPlans.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">
              등록된 학습 계획이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDay.studyPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="text-xs p-2 border rounded-md flex justify-between"
                >
                  <div>
                    <span className="font-medium">{plan.subject}</span>
                    <p className="text-gray-600 mt-0.5">{plan.content}</p>
                  </div>
                  <div className="text-gray-500">
                    {plan.achievement}/{plan.target}분
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-2 text-center">
            <a
              href={`/study-plans/new?date=${selectedDay.date.toISOString()}`}
              className="text-xs text-blue-500 hover:underline"
            >
              새 학습 계획 추가
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 