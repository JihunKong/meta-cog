import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { supabase } from "@/lib/supabase";

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
  
  if (process.env.NODE_ENV === "production") {
    url = "https://pure-ocean.netlify.app";
  } else if (process.env.NEXTAUTH_URL) {
    url = process.env.NEXTAUTH_URL;
  } else {
    url = "http://localhost:3000";
  }
  
  url = url.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  return url;
};

const baseUrl = getBaseUrl();

// 디버깅을 위한 환경 변수 로깅
console.log("NextAuth 환경 변수 확인:", {
  BASE_URL: baseUrl,
  NODE_ENV: process.env.NODE_ENV,
});

export const authOptions: NextAuthOptions = {
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

          // Supabase로 로그인 시도
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (signInError) {
            console.error("Supabase 로그인 실패:", signInError);
            throw new Error("이메일 또는 비밀번호가 일치하지 않습니다");
          }

          if (!authData.user) {
            throw new Error("사용자를 찾을 수 없습니다");
          }

          // User 테이블에서 추가 정보 조회
          const { data: userData, error: userError } = await supabase
            .from('User')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (userError || !userData) {
            console.error("사용자 정보 조회 실패:", userError);
            throw new Error("사용자 정보를 찾을 수 없습니다");
          }

          return {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role
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
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
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