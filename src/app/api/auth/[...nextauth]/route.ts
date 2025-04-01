import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase, supabaseAdmin } from "@/lib/supabase";

// 고정 URL 설정 - Netlify 배포 URL
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL 
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "http://localhost:3000";

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

          // User 테이블에서 추가 정보 조회 (관리자 권한 사용)
          const { data: userData, error: userError } = await supabaseAdmin
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
            role: userData.role,
            student_id: userData.student_id || null
          };
        } catch (error) {
          console.error("인증 오류:", error);
          throw error;
        }
      }
    })
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
        token.student_id = user.student_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.student_id = (token.student_id as string) || null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('리다이렉트 시도:', { url, baseUrl });
      
      // 절대 로컬호스트로 가지 않도록 강제 설정
      const productionUrl = "https://meta-cog.netlify.app";
      const finalBaseUrl = process.env.NODE_ENV === "production" ? productionUrl : baseUrl;
      
      // 로그아웃의 경우
      if (url.includes("signout")) {
        return `${finalBaseUrl}/auth/signin`;
      }
      
      // 상대 경로인 경우 (가장 먼저 체크)
      if (url.startsWith("/")) {
        return `${finalBaseUrl}${url}`;
      }
      
      // API 경로나 홈페이지인 경우
      if (url.includes("/api/auth") || url === finalBaseUrl || url === baseUrl) {
        return `${finalBaseUrl}/dashboard`;
      }
      
      // 허용된 도메인인 경우
      if (url.startsWith(finalBaseUrl) || url.startsWith(productionUrl)) {
        return url;
      }
      
      // 그 외의 모든 경우는 대시보드로
      return `${finalBaseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signin'
  },
  debug: false,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 