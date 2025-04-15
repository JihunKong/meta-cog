import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth";

export default async function DashboardPage() {
  const role = await getUserRole();
  if (role === "STUDENT") redirect("/dashboard/student");
  else if (role === "TEACHER") redirect("/dashboard/teacher");
  else if (role === "ADMIN") redirect("/dashboard/admin");
  return <div>권한 정보가 없습니다.</div>;
}
