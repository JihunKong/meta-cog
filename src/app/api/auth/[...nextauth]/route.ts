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
    console.log("대체 URL 형식 시도를 권장합니다:");
    console.log("1. Session pooler: postgresql://postgres.ljrrinokzegzjbovssjy:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres");
    console.log("2. Direct connection: postgresql://postgres:[비밀번호]@db.ljrrinokzegzjbovssjy.supabase.co:5432/postgres");
  });

// 개발 환경에서 사용할 URL을 설정합니다.
// URL 형식이 올바른지 확인하고 콜론 누락 등 일반적인 오류를 수정
const getBaseUrl = () => {
  let url = process.env.NEXTAUTH_URL;
  
  // 프로덕션 환경에서 NEXTAUTH_URL이 설정되지 않은 경우 Vercel URL을 사용
  if (!url && process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`;
    console.log("Vercel URL 감지:", url);
  }
  
  // 기본값 설정
  if (!url) {
    url = "http://localhost:3000";
    console.log("기본 URL 사용:", url);
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
  
  // 맨 끝에 슬래시가 있으면 제거
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  console.log("URL 정리 후:", url);
  
  return url;
};

const baseUrl = getBaseUrl();

// 디버깅을 위한 환경 변수 로깅
console.log("NextAuth 환경 변수 확인:", {
  ORIGINAL_NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  CORRECTED_NEXTAUTH_URL: baseUrl,
  DATABASE_URL: process.env.DATABASE_URL?.substring(0, 20) + '...',
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