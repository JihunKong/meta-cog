import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// 개발 환경에서 사용할 URL을 설정합니다.
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Vercel 프리뷰 환경 URL을 처리하기 위해 빈 문자열 사용
      // 리디렉션 URI는 구글 클라우드 콘솔에서 여러 개 설정해야 함
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      // 초기 로그인 시 user 객체가 전달됨
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      // 세션이 업데이트 될 때, DB에서 최신 역할 정보를 가져옴
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { role: true, id: true }
          });
          
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          }
        } catch (error) {
          console.error("DB에서 사용자 정보 가져오기 실패:", error);
        }
      }
      
      console.log("JWT 콜백:", { token });
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // 역할이 없으면 STUDENT로 기본 설정
        session.user.role = (token.role || "STUDENT") as UserRole;
      }
      console.log("세션 콜백:", { 
        sessionUserId: session.user?.id,
        sessionUserRole: session.user?.role,
        tokenId: token.id,
        tokenRole: token.role
      });
      return session;
    },
    async signIn({ account, profile, user }) {
      if (account?.provider === "google" && profile?.email) {
        const email = profile.email;

        // 이메일 도메인 확인 - 허용된 도메인만 접근 가능
        const isDevelopment = process.env.NODE_ENV === "development";
        const isAdmin = email === "purusil55@gmail.com";
        const isStudent = email.endsWith("@e.jne.go.kr");
        const isTeacher = email.endsWith("@h.jne.go.kr");
        
        // 개발 환경이거나 허용된 도메인만 로그인 가능
        const isValidDomain = isDevelopment || isAdmin || isStudent || isTeacher;
        
        if (!isValidDomain) {
          console.error(`허용되지 않은 도메인: ${email}`);
          return false;
        }

        try {
          let role: string = "STUDENT"; // 기본값
          
          if (isAdmin) {
            role = "ADMIN";
            console.log(`관리자 권한 설정: ${email}`);
          } else if (isTeacher) {
            role = "TEACHER";
            console.log(`교사 권한 설정: ${email}`);
          } else if (isStudent) {
            role = "STUDENT";
            console.log(`학생 권한 설정: ${email}`);
          }
          
          // 사용자가 이미 존재하는지 확인
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });
          
          if (existingUser) {
            // 사용자 역할 업데이트
            await prisma.user.update({
              where: { email },
              data: { role: role as any }
            });
            console.log(`사용자 ${email}의 역할이 ${role}로 업데이트되었습니다.`);
          } else {
            console.log(`사용자 ${email}가 존재하지 않습니다. 새로 생성될 예정입니다.`);
          }
        } catch (error) {
          console.error("사용자 역할 업데이트 실패:", error);
          // 실패해도 로그인 진행
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 로그인 후 리다이렉션 처리
      const vercelUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : baseUrl;
      
      // 현재 URL이 Vercel URL이나 baseUrl로 시작하는 경우 해당 URL 반환
      if (url.startsWith(baseUrl) || (process.env.VERCEL_URL && url.startsWith(vercelUrl))) {
        return url;
      }
      
      // 상대 URL인 경우 현재 환경에 맞는 baseUrl과 결합
      if (url.startsWith("/")) {
        return process.env.VERCEL_URL ? `${vercelUrl}${url}` : `${baseUrl}${url}`;
      }
      
      return process.env.VERCEL_URL ? vercelUrl : baseUrl;
    }
  },
  events: {
    createUser: async ({ user }) => {
      console.log("새 사용자 생성됨:", user);
      
      // 새 사용자가 생성될 때 기본 역할 설정
      try {
        const email = user.email;
        if (email) {
          let role: string = "STUDENT"; // 기본값
          
          if (email === "purusil55@gmail.com") {
            role = "ADMIN";
          } else if (email.endsWith("@h.jne.go.kr")) {
            role = "TEACHER";
          } else if (email.endsWith("@e.jne.go.kr")) {
            role = "STUDENT";
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: { role: role as any }
          });
          console.log(`사용자 ${email}의 역할이 ${role}로 설정되었습니다.`);
        }
      } catch (error) {
        console.error("새 사용자 역할 설정 실패:", error);
      }
    },
    signIn: ({ user }) => {
      console.log("사용자 로그인:", user);
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 