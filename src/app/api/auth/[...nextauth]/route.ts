import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// 개발 환경에서 사용할 URL을 설정합니다.
// URL 형식이 올바른지 확인하고 콜론 누락 등 일반적인 오류를 수정
const getBaseUrl = () => {
  let url = process.env.NEXTAUTH_URL;
  
  // 프로덕션 환경에서 NEXTAUTH_URL이 설정되지 않은 경우 Vercel URL을 사용
  if (!url && process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`;
  }
  
  // 기본값 설정
  if (!url) {
    url = "http://localhost:3000";
  }
  
  console.log("URL 정리 전:", url);
  
  // URL 형식 검증 (필요 시 콜론 추가)
  if (url.includes('https//')) {
    url = url.replace('https//', 'https://');
  }
  
  // URL 앞에 추가된 텍스트가 있는지 확인 (대소문자 무시)
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('nextauth_url=')) {
    const urlParts = url.split(/nextauth_url=/i);
    url = urlParts.length > 1 ? urlParts[1] : url;
  }
  
  // 환경 변수 이름이 값에 포함된 경우(대소문자 구분)
  if (url.startsWith('NEXTAUTH_URL=')) {
    url = url.substring('NEXTAUTH_URL='.length);
  }
  
  console.log("URL 정리 후:", url);
  
  return url;
};

const baseUrl = getBaseUrl();

// 디버깅을 위한 환경 변수 로깅
console.log("NextAuth 환경 변수 확인:", {
  ORIGINAL_NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  CORRECTED_NEXTAUTH_URL: baseUrl,
  VERCEL_URL: process.env.VERCEL_URL,
  NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  NODE_ENV: process.env.NODE_ENV,
  // 중요: 실제 값은 로그에 출력하지 않고 존재 여부만 확인
  GOOGLE_CLIENT_ID_EXISTS: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // 기본 설정으로 단순화
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 초기 로그인 시 user 객체가 전달됨
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // 역할이 없으면 STUDENT로 기본 설정
        session.user.role = (token.role || "STUDENT") as UserRole;
      }
      return session;
    },
    async signIn({ account, profile, user }) {
      console.log("로그인 시도:", { 
        email: profile?.email,
        name: profile?.name,
      });
      
      // 프로필이 없는 경우 처리
      if (!profile || !profile.email) {
        console.error("프로필 정보가 없습니다.");
        return false;
      }
      
      const email = profile.email;
      
      // 도메인 검증 간소화
      const isAllowedDomain = 
        email.endsWith("@e.jne.go.kr") || 
        email.endsWith("@h.jne.go.kr") ||
        email === "purusil55@gmail.com" ||
        email === "jihun.kong@gmail.com" ||
        email === "kong.jihun@gmail.com";
      
      // 개발 환경에서는 모든 이메일 허용
      const allowAnyEmail = process.env.NODE_ENV === "development" || true; // 임시로 모든 이메일 허용
      
      if (!isAllowedDomain && !allowAnyEmail) {
        console.error(`허용되지 않은 이메일 도메인: ${email}`);
        return false;
      }
      
      console.log(`이메일 ${email} 로그인 허용`);
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 리디렉션 로직 단순화
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  debug: true, // 모든 환경에서 디버그 활성화
};

const handler = NextAuth(authOptions);

// 최종 URL을 확인하여 문제 진단
const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api/auth`;

// 디버깅용 로그 추가
console.log("NextAuth 핸들러 초기화 완료. URL 정보:", {
  BASE_URL,
  API_URL,
  CALLBACK_URL: `${API_URL}/callback/google`
});

export { handler as GET, handler as POST }; 