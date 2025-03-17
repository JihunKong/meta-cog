"use client";

import { useEffect, useState, useRef } from "react";
import { easeOutExpo } from "@/lib/utils";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
  className?: string;
}

export function CountUp({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  decimalPlaces = 0,
  className = "text-3xl font-bold",
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // 값이 변경되면 다시 애니메이션 시작
    startAnimation();

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end]);

  const startAnimation = () => {
    // 기존 애니메이션 취소
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    // 애니메이션 시작 시간 및 초기 값 설정
    startTimeRef.current = performance.now();
    countRef.current = count;

    // 애니메이션 프레임 함수
    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      // 새 값 계산
      const newCount = countRef.current + (end - countRef.current) * easedProgress;
      setCount(newCount);

      // 애니메이션이 끝나지 않았으면 다음 프레임 요청
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animateCount);
      } else {
        setCount(end);
      }
    };

    // 첫 프레임 시작
    frameRef.current = requestAnimationFrame(animateCount);
  };

  // 숫자 포맷팅
  const formattedCount = () => {
    const value = count.toFixed(decimalPlaces);
    return `${prefix}${value}${suffix}`;
  };

  return <span className={className}>{formattedCount()}</span>;
} 