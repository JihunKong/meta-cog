import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

// 데이터베이스 연결 확인 로그
prisma.$connect()
  .then(() => {
    console.log("데이터베이스 연결 성공!");
  })
  .catch((e) => {
    console.error("데이터베이스 연결 실패:", e);
    console.log("데이터베이스 연결 문자열을 확인하세요");
  });

// URL 설정 로직 업데이트
const getBaseUrl = () => {
  let url;
  
  // 고정 Netlify URL 사용 (배포된 환경에 맞게 수정)
  if (process.env.NODE_ENV === "production") {
    url = "https://pure-ocean.netlify.app";
    console.log("프로덕션 고정 URL 사용:", url);
  }
  // Netlify 환경 변수 확인
  else if (process.env.NETLIFY && process.env.URL) {
    url = process.env.URL;
    console.log("Netlify URL 감지:", url);
  }
  // Netlify 개발 URL
  else if (process.env.NETLIFY_DEV && process.env.NETLIFY_DEV_URL) {
    url = process.env.NETLIFY_DEV_URL;
    console.log("Netlify Dev URL 감지:", url);
  }
  // 명시적으로 설정된 URL 사용
  else if (process.env.NEXTAUTH_URL) {
    url = process.env.NEXTAUTH_URL;
    console.log("NEXTAUTH_URL 사용:", url);
  }
  // 기본값 설정
  else {
    url = "http://localhost:3000";
    console.log("기본 URL 사용:", url);
  }
  
  // URL 정리
  url = url.trim();
  
  // URL 유효성 검사
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  console.log("최종 BASE URL:", url);
  
  return url;
};

const baseUrl = getBaseUrl();

// 디버깅을 위한 환경 변수 로깅
console.log("NextAuth 환경 변수 확인:", {
  BASE_URL: baseUrl,
  NODE_ENV: process.env.NODE_ENV,
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "이메일/비밀번호",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("이메일과 비밀번호를 입력해주세요");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          }).catch(err => {
            console.error("사용자 조회 중 데이터베이스 오류:", err);
            throw new Error("로그인 처리 중 오류가 발생했습니다. 관리자에게 문의하세요.");
          });

          if (!user || !user.password) {
            console.log("사용자 없음 또는 비밀번호 없음:", credentials.email);
            throw new Error("이메일 또는 비밀번호가 일치하지 않습니다");
          }

          const isPasswordValid = await compare(credentials.password, user.password).catch(err => {
            console.error("비밀번호 비교 중 오류:", err);
            throw new Error("로그인 처리 중 오류가 발생했습니다. 관리자에게 문의하세요.");
          });

          if (!isPasswordValid) {
            console.log("비밀번호 불일치:", credentials.email);
            throw new Error("이메일 또는 비밀번호가 일치하지 않습니다");
          }

          console.log("로그인 성공:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        } catch (error) {
          console.error("인증 과정 오류:", error);
          throw error;
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'META_COG_DEFAULT_SECRET',
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      // 초기 로그인 시 user 객체가 전달됨
      if (user) {
        console.log("JWT 콜백 - 사용자 정보:", {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "STUDENT"
        });
        
        token.id = user.id;
        // 역할이 없으면 기본값으로 STUDENT 사용
        token.role = user.role || "STUDENT";
      }
      
      // 토큰 내용 로깅 (중요 정보 제외)
      console.log("JWT 토큰 정보:", {
        userId: token.id,
        name: token.name,
        email: token.email,
        role: token.role || "STUDENT"
      });
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // 역할이 없으면 STUDENT로 기본 설정
        session.user.role = (token.role || "STUDENT") as UserRole;
        
        console.log("세션 정보:", {
          userId: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role
        });
      }
      return session;
    },
    // 리디렉션 콜백 유지
    async redirect({ url, baseUrl }) {
      // 디버깅을 위한 로그 추가
      console.log("리디렉션 콜백:", { url, baseUrl });
      
      // 상대 URL인 경우 (예: "/dashboard")
      if (url.startsWith("/")) {
        console.log(`상대 URL 감지: ${url}, 기본 URL에 추가: ${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      // 이미 절대 URL인 경우 (예: "https://example.com/dashboard")
      else if (url.startsWith("http")) {
        // 같은 도메인인지 확인
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.hostname === baseUrlObj.hostname) {
          console.log(`같은 도메인 URL 감지: ${url}, 허용됨`);
          return url;
        } else {
          console.log(`외부 도메인 URL 감지: ${url}, 기본 URL로 리디렉션: ${baseUrl}`);
          return baseUrl;
        }
      }
      
      // 기본적으로 baseUrl로 리디렉션
      console.log(`기본 리디렉션: ${baseUrl}`);
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

// 최종 URL을 확인하여 문제 진단
const API_URL = `${baseUrl}/api/auth`;

// 디버깅용 로그 추가
console.log("NextAuth 핸들러 초기화 완료. URL 정보:", {
  BASE_URL: baseUrl,
  API_URL,
});

export { handler as GET, handler as POST }; 