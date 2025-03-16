import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // 어댑터 다시 활성화

// 데이터베이스 연결 확인 - 실제 데이터베이스 사용 시 주석 해제 
// DATABASE_URL을 Supabase Transaction pooler URL로 설정:
// postgresql://postgres.ljrrinokzegzjbovssjy:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

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
  VERCEL_URL: process.env.VERCEL_URL,
  NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  NODE_ENV: process.env.NODE_ENV,
  // 중요: 실제 값은 로그에 출력하지 않고 존재 여부만 확인
  GOOGLE_CLIENT_ID_EXISTS: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // 어댑터 활성화
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
  secret: process.env.NEXTAUTH_SECRET || 'META_COG_DEFAULT_SECRET',
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
    async signIn({ account, profile, user }) {
      try {
        // 디버깅을 위한 상세 로그
        console.log("===== 로그인 시도 - 상세 정보 =====");
        console.log("profile:", JSON.stringify(profile, null, 2));
        console.log("account:", JSON.stringify(account, null, 2));
        console.log("user:", user ? JSON.stringify(user, null, 2) : "사용자 정보 없음");
        console.log("환경 변수:", {
          NODE_ENV: process.env.NODE_ENV,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          VERCEL_URL: process.env.VERCEL_URL,
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
        
        // 개발 환경에서는 모든 이메일 허용 (논리 오류 수정)
        const allowAnyEmail = process.env.NODE_ENV === "development" || process.env.ALLOW_ALL_EMAILS === "true";
        
        if (!isAllowedDomain && !allowAnyEmail) {
          console.error(`허용되지 않은 이메일 도메인: ${email}`);
          return false;
        }
        
        console.log(`이메일 ${email} 로그인 허용`);
        
        // 사용자 역할 설정 (데이터베이스 어댑터 활성화 시 작동)
        if (user) {
          try {
            // 관리자 이메일 목록
            const adminEmails = [
              "purusil55@gmail.com",
              "jihun.kong@gmail.com",
              "kong.jihun@gmail.com"
            ];
            
            // 교사 도메인 확인
            const isTeacher = email.endsWith("@h.jne.go.kr");
            
            // 역할 결정
            let role: UserRole = "STUDENT"; // 기본값
            
            if (adminEmails.includes(email)) {
              role = "ADMIN";
            } else if (isTeacher) {
              role = "TEACHER";
            }
            
            console.log(`사용자 ${email}에게 역할 할당: ${role}`);
            
            // 데이터베이스에서 사용자 역할 업데이트
            await prisma.user.update({
              where: { id: user.id },
              data: { role }
            });
            
            console.log(`사용자 역할 성공적으로 업데이트: ${role}`);
          } catch (dbError) {
            console.error("사용자 역할 업데이트 중 오류:", dbError);
            // 데이터베이스 오류가 있어도 로그인은 허용
          }
        }
        
        return true;
      } catch (error) {
        console.error("로그인 과정에서 오류 발생:", error);
        // 스택 트레이스 로깅
        if (error instanceof Error) {
          console.error("오류 스택:", error.stack);
        }
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // 로깅 추가
        console.log("===== 리디렉션 처리 =====");
        console.log("url:", url);
        console.log("baseUrl:", baseUrl);
        console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
        console.log("VERCEL_URL:", process.env.VERCEL_URL);
        
        // 사용할 기본 URL 결정
        let finalBaseUrl = baseUrl;
        
        // 커스텀 도메인 사용
        if (process.env.NEXTAUTH_URL) {
          finalBaseUrl = process.env.NEXTAUTH_URL;
          console.log("NEXTAUTH_URL 사용:", finalBaseUrl);
        }
        // Vercel URL 사용 (백업)
        else if (process.env.VERCEL_URL) {
          finalBaseUrl = `https://${process.env.VERCEL_URL}`;
          console.log("VERCEL_URL 사용:", finalBaseUrl);
        }
        
        // 최종 리디렉션 URL 결정
        let finalUrl;

        // 로그인 후 또는 기본 경로일 때 역할별 대시보드로 리디렉션
        if (url?.includes('/api/auth/signin') || 
            url?.includes('/api/auth/callback') || 
            url === '/' || 
            !url) {
          // token이 없는 환경에서는 기본 대시보드로 리디렉션
          // 역할별 리디렉션은 클라이언트 측에서 처리할 수 있도록 기본 대시보드로 우선 이동
          const dashboardUrl = `${finalBaseUrl}/dashboard`;
          console.log("로그인 후 대시보드로 리디렉션:", dashboardUrl);
          return dashboardUrl;
        }
        
        if (!url) {
          finalUrl = `${finalBaseUrl}/dashboard`; // 기본값을 대시보드로 변경
        }
        else if (url.startsWith("/")) {
          // 상대 경로
          finalUrl = `${finalBaseUrl}${url}`;
        }
        else if (url.startsWith("http")) {
          // 절대 URL
          try {
            const urlObj = new URL(url);
            const baseUrlObj = new URL(finalBaseUrl);
            
            // 같은 도메인인 경우에만 허용
            if (urlObj.hostname === baseUrlObj.hostname) {
              finalUrl = url;
            } else {
              console.log("외부 도메인으로 리디렉션 차단:", url);
              finalUrl = finalBaseUrl;
            }
          } catch (e) {
            console.error("URL 파싱 오류:", e);
            finalUrl = finalBaseUrl;
          }
        }
        else {
          // 기타 케이스
          finalUrl = finalBaseUrl;
        }
        
        console.log("최종 리디렉션 URL:", finalUrl);
        return finalUrl;
      } catch (error) {
        console.error("리디렉션 처리 중 오류:", error);
        if (error instanceof Error) {
          console.error("오류 스택:", error.stack);
        }
        // 안전하게 홈으로 리디렉션
        return baseUrl || '/';
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    // 로그인 성공 후 리디렉션될 기본 페이지 지정
    newUser: "/dashboard",
    // 기본 페이지도 설정
    signOut: "/auth/signout",
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