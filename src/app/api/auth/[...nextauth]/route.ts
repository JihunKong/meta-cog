import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase, supabaseAdmin } from "@/lib/supabase";

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
      // 절대 경로인 경우 바로 리디렉션
      if (url.startsWith('http')) {
        return url;
      }
      
      // 클라이언트 사이드에서 현재 URL 사용
      if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (url.startsWith('/')) {
          return `${origin}${url}`;
        }
      }
      
      // 상대 경로인 경우
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // 기본 리디렉션
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signin'
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 