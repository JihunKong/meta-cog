import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
  const { searchParams } = new URL(request.url);
  const student_id = searchParams.get("student_id");
  const smart_goal_id = searchParams.get("smart_goal_id");

  try {
    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("피드백 가져오기 인증 오류:", authError);
      return NextResponse.json(
        { error: "인증되지 않은 사용자" },
        { status: 401 }
      );
    }

    // 사용자가 교사인지 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "teacher") {
      console.error("권한 오류:", profileError);
      return NextResponse.json(
        { error: "교사 권한이 필요합니다" },
        { status: 403 }
      );
    }

    let query = supabase.from("teacher_feedback").select(`
      id,
      teacher_id,
      student_id,
      smart_goal_id,
      feedback,
      created_at,
      updated_at,
      teacher_details:teacher_id(display_name)
    `);

    if (student_id) {
      query = query.eq("student_id", student_id);
    }

    if (smart_goal_id) {
      query = query.eq("smart_goal_id", smart_goal_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("피드백 가져오기 오류:", error);
      return NextResponse.json(
        { error: "피드백을 가져오는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const { student_id, smart_goal_id, feedback } = await request.json();

    if (!student_id || !smart_goal_id || !feedback) {
      return NextResponse.json(
        { error: "모든 필수 필드가 필요합니다" },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("피드백 작성 인증 오류:", authError);
      return NextResponse.json(
        { error: "인증되지 않은 사용자" },
        { status: 401 }
      );
    }

    // 사용자가 교사인지 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "teacher") {
      console.error("권한 오류:", profileError);
      return NextResponse.json(
        { error: "교사 권한이 필요합니다" },
        { status: 403 }
      );
    }

    // 피드백 저장
    const { data, error } = await supabase
      .from("teacher_feedback")
      .insert({
        teacher_id: user.id,
        student_id,
        smart_goal_id,
        feedback,
      })
      .select();

    if (error) {
      console.error("피드백 저장 오류:", error);
      return NextResponse.json(
        { error: "피드백을 저장하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const { id, feedback } = await request.json();

    if (!id || !feedback) {
      return NextResponse.json(
        { error: "모든 필수 필드가 필요합니다" },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("피드백 수정 인증 오류:", authError);
      return NextResponse.json(
        { error: "인증되지 않은 사용자" },
        { status: 401 }
      );
    }

    // 사용자가 교사인지 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "teacher") {
      console.error("권한 오류:", profileError);
      return NextResponse.json(
        { error: "교사 권한이 필요합니다" },
        { status: 403 }
      );
    }

    // 피드백이 현재 교사의 것인지 확인
    const { data: existingFeedback, error: feedbackError } = await supabase
      .from("teacher_feedback")
      .select("teacher_id")
      .eq("id", id)
      .single();

    if (feedbackError || !existingFeedback) {
      console.error("피드백 찾기 오류:", feedbackError);
      return NextResponse.json(
        { error: "피드백을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existingFeedback.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "자신의 피드백만 수정할 수 있습니다" },
        { status: 403 }
      );
    }

    // 피드백 업데이트
    const { data, error } = await supabase
      .from("teacher_feedback")
      .update({ feedback })
      .eq("id", id)
      .select();

    if (error) {
      console.error("피드백 업데이트 오류:", error);
      return NextResponse.json(
        { error: "피드백을 업데이트하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "피드백 ID가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("피드백 삭제 인증 오류:", authError);
      return NextResponse.json(
        { error: "인증되지 않은 사용자" },
        { status: 401 }
      );
    }

    // 사용자가 교사인지 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "teacher") {
      console.error("권한 오류:", profileError);
      return NextResponse.json(
        { error: "교사 권한이 필요합니다" },
        { status: 403 }
      );
    }

    // 피드백이 현재 교사의 것인지 확인
    const { data: existingFeedback, error: feedbackError } = await supabase
      .from("teacher_feedback")
      .select("teacher_id")
      .eq("id", id)
      .single();

    if (feedbackError || !existingFeedback) {
      console.error("피드백 찾기 오류:", feedbackError);
      return NextResponse.json(
        { error: "피드백을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existingFeedback.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "자신의 피드백만 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    // 피드백 삭제
    const { error } = await supabase
      .from("teacher_feedback")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("피드백 삭제 오류:", error);
      return NextResponse.json(
        { error: "피드백을 삭제하는 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 