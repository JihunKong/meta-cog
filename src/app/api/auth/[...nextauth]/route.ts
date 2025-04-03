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
          console.log("인증 시도:", credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log("이메일 또는 비밀번호 누락");
            throw new Error("이메일과 비밀번호를 입력해주세요");
          }

          // Supabase로 로그인 시도
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          console.log("Supabase 인증 결과:", { 
            success: !!authData?.user, 
            error: signInError?.message,
            userId: authData?.user?.id 
          });

          if (signInError) {
            console.error("Supabase 로그인 실패:", signInError);
            throw new Error("이메일 또는 비밀번호가 일치하지 않습니다");
          }

          if (!authData.user) {
            console.log("사용자 인증 정보가 없음");
            throw new Error("사용자를 찾을 수 없습니다");
          }

          // Supabase Auth 메타데이터 확인
          const { data: authUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
            authData.user.id
          );

          console.log("Auth 사용자 메타데이터:", { 
            appMetadata: authUserData?.user?.app_metadata,
            role: authUserData?.user?.app_metadata?.role 
          });

          // User 테이블에서 추가 정보 조회 (관리자 권한 사용)
          const { data: userData, error: userError } = await supabaseAdmin
            .from('User')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          console.log("User 테이블 조회 결과:", { 
            found: !!userData,
            error: userError?.message,
            userData: userData 
          });

          if (userError || !userData) {
            console.error("사용자 정보 조회 실패:", userError);
            throw new Error("사용자 정보를 찾을 수 없습니다");
          }

          // Auth 메타데이터와 User 테이블 모두에서 역할 확인
          const role = 
            authUserData?.user?.app_metadata?.role || 
            userData.role || 
            "STUDENT";

          console.log("최종 사용자 정보:", {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: role
          });

          return {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: role,
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
        console.log("JWT 생성:", { user });
        token.id = user.id;
        token.role = user.role;
        token.student_id = user.student_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log("세션 생성:", { token });
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.student_id = (token.student_id as string) || null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 기본 URL로 리디렉션
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signin'
  },
  debug: true, // 디버깅 활성화
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 