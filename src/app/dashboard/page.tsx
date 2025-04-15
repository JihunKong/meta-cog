import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function DashboardPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  if (role === "STUDENT") redirect("/dashboard/student");
  else if (role === "TEACHER") redirect("/dashboard/teacher");
  else if (role === "ADMIN") redirect("/dashboard/admin");
  return <div>권한 정보가 없습니다.</div>;
}
