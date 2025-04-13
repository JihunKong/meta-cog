import { getSiteUrl } from './utils';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
}

/**
 * API 호출을 위한 공통 함수
 * 상대 경로를 사용하되, 필요 시 절대 URL로 변환합니다.
 */
export async function apiCall<T = any>(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, cache } = options;
  
  // URL이 이미 http:// 또는 https://로 시작하는지 확인
  const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  
  // 상대 경로인 경우 기본 URL을 붙임
  const url = isAbsoluteUrl ? endpoint : `${getSiteUrl()}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  console.log(`[API 호출] ${method} ${url}`);
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
    ...(cache && { cache }),
  };
  
  const response = await fetch(url, requestOptions);
  
  // 응답 확인
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error details');
    console.error(`API 오류 (${response.status}):`, errorText);
    
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error?.message || `API 요청 실패: ${response.status}`);
    } catch (e) {
      throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
    }
  }
  
  try {
    return await response.json();
  } catch (e) {
    console.error('응답 파싱 오류:', e);
    throw new Error('서버 응답을 처리할 수 없습니다');
  }
} 