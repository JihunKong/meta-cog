import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import { UserRole } from "@/types";
import CredentialsProvider from "next-auth/providers/credentials";
import { checkSupabaseClient, checkSupabaseAdmin } from "@/lib/supabase";

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
          
          // 테스트 계정 처리 (admin@pof.com)
          if (credentials?.email === "admin@pof.com" && credentials?.password === "admin1234") {
            console.log("테스트 관리자 계정 직접 반환");
            // 테스트 계정은 무조건 로그인 성공 처리
            return {
              id: "admin-test-id",
              name: "관리자",
              email: "admin@pof.com",
              role: "ADMIN",
              student_id: null
            };
          }
          
          if (!credentials?.email || !credentials?.password) {
            console.log("이메일 또는 비밀번호 누락");
            throw new Error("이메일과 비밀번호를 입력해주세요");
          }

          // Supabase 클라이언트 초기화 확인
          const supabase = checkSupabaseClient();
          const supabaseAdmin = checkSupabaseAdmin();

          // Supabase로 로그인 시도
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          console.log("Supabase 인증 결과:", { 
            success: !!authData?.user, 
            error: signInError?.message,
            userId: authData?.user?.id,
            email: authData?.user?.email
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
            userMetadata: authUserData?.user?.user_metadata,
            role: authUserData?.user?.app_metadata?.role,
            email: authUserData?.user?.email
          });

          if (getUserError) {
            console.error("Auth 사용자 정보 조회 실패:", getUserError);
          }

          // User 테이블에서 추가 정보 조회 (관리자 권한 사용)
          const { data: userData, error: userError } = await supabaseAdmin
            .from('User')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          console.log("User 테이블 조회 결과:", { 
            found: !!userData,
            error: userError?.message,
            userData: userData,
            userId: authData.user.id  
          });

          if (userError || !userData) {
            console.error("사용자 정보 조회 실패:", userError);
            
            // 사용자 정보가 없으면 User 테이블에 자동으로 추가 시도
            console.log("User 테이블에 사용자 추가 시도", {
              id: authData.user.id,
              email: credentials.email,
              role: authUserData?.user?.app_metadata?.role || "STUDENT",
              name: authUserData?.user?.user_metadata?.name || credentials.email
            });
            
            const role = authUserData?.user?.app_metadata?.role || "STUDENT";
            const name = authUserData?.user?.user_metadata?.name || credentials.email;
            
            const { data: insertData, error: insertError } = await supabaseAdmin
              .from('User')
              .insert([{
                id: authData.user.id,
                email: credentials.email,
                name: name,
                role: role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
              .single();
              
            // 오류를 더 자세히 로깅
            if (insertError) {
              console.error("사용자 정보 추가 실패 상세:", {
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint,
                message: insertError.message
              });
            }
            
            console.log("User 테이블 추가 결과:", {
              success: !!insertData,
              error: insertError?.message,
              data: insertData
            });
            
            if (insertError || !insertData) {
              console.error("사용자 정보 추가 실패:", insertError);
              throw new Error("사용자 정보를 찾을 수 없고 추가도 실패했습니다");
            }
            
            // 성공적으로 추가된 사용자 정보 사용
            return {
              id: insertData.id,
              name: insertData.name,
              email: insertData.email,
              role: insertData.role,
              student_id: insertData.student_id || null
            };
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
    signOut: '/'
  },
  debug: true, // 디버깅 활성화
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 