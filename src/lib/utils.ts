import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 사이트의 기본 URL을 반환합니다.
 * 환경에 따라 적절한 URL을 사용합니다.
 */
export function getSiteUrl(): string {
  let url;
  
  // 프로덕션 환경에서는 Netlify URL 사용
  if (process.env.NODE_ENV === "production") {
    url = "https://pure-ocean.netlify.app";
  }
  // Netlify 환경 변수 사용
  else if (process.env.NETLIFY && process.env.URL) {
    url = process.env.URL;
  }
  // Netlify 개발 URL
  else if (process.env.NETLIFY_DEV && process.env.NETLIFY_DEV_URL) {
    url = process.env.NETLIFY_DEV_URL;
  }
  // NextAuth URL 사용
  else if (process.env.NEXTAUTH_URL) {
    url = process.env.NEXTAUTH_URL;
  }
  // 기본값은 로컬호스트
  else {
    url = "http://localhost:3000";
  }
  
  // URL 정리
  url = url.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 포맷팅합니다.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 YYYY년 MM월 DD일 형식의 한국어 문자열로 포맷팅합니다.
 */
export function formatDateKorean(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 시간을 HH:MM 형식의 문자열로 포맷팅합니다.
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * 주어진 날짜가 포함된 주의 시작일(월요일)과 종료일(일요일)을 반환합니다.
 */
export function getWeekRange(date: Date | string = new Date()): { start: Date; end: Date } {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  
  // 현재 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
  const day = d.getDay();
  
  // 주의 시작일 (월요일)
  const start = new Date(d);
  // 일요일(0)인 경우 6일 전으로, 그 외에는 현재 요일 - 1만큼 이전으로
  const daysToSubtract = day === 0 ? 6 : day - 1;
  start.setDate(d.getDate() - daysToSubtract);
  start.setHours(0, 0, 0, 0);
  
  // 주의 종료일 (일요일)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * 학습 계획 달성률을 계산합니다.
 */
export function calculateAchievementRate(achievement: number): number {
  if (achievement === undefined || achievement === null) {
    return 0;
  }
  
  // 달성률은 이미 퍼센트(0-100) 값으로 저장되어 있으므로 그대로 반환
  return Math.round(achievement);
}

/**
 * 애니메이션을 위한 easing 함수
 */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * 사용자 역할을 확인하는 유틸리티 함수
 */
export function checkUserRole(user: any, allowedRoles: string[]): boolean {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}
