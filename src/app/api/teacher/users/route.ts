import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// Supabase 클라이언트 생성 - 런타임에만 초기화
// 빌드 시에는 초기화하지 않고 런타임에만 초기화
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("Supabase 설정:", { 
    url: supabaseUrl ? '설정됨' : '설정되지 않음', 
    hasAnonKey: !!supabaseAnonKey 
  });
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// 학생 목록 조회 API (교사만 접근 가능)
export async function GET(req: Request) {
  try {
    console.log("학생 목록 조회 API 호출됨");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("인증 실패: 세션 없음");
      throw new ApiError(401, "인증이 필요합니다");
    }

    console.log("인증된 사용자:", session.user.email, "역할:", session.user.role);

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      console.log("권한 오류: 교사 또는 관리자가 아님");
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    // URL에서 role 파라미터 추출
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    console.log("요청된 역할:", role);

    try {
      // Supabase 클라이언트 초기화
      const supabase = getSupabaseClient();
      
      // 학생 목록 조회 (role 파라미터가 있으면 해당 역할의 사용자만 조회)
      console.log("Supabase 쿼리 시작");
      
      let query = supabase
        .from('User')
        .select('id, name, email, image, role');
      
      if (role) {
        query = query.eq('role', role);
      } else {
        query = query.eq('role', 'STUDENT');
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error("Supabase 쿼리 오류:", error);
        throw new ApiError(500, `데이터베이스 오류: ${error.message}`);
      }
      
      console.log(`조회된 사용자 수: ${data?.length || 0}`);
      return successResponse(data || []);
    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError);
      throw new ApiError(500, `데이터베이스 오류: ${(dbError as Error).message}`);
    }
  } catch (error) {
    console.error("학생 목록 조회 API 오류:", error);
    return errorResponse(error as Error);
  }
} 