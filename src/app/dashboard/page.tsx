"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const role = await getUserRole();
      if (role === "STUDENT") router.replace("/dashboard/student");
      else if (role === "TEACHER") router.replace("/dashboard/teacher");
      else if (role === "ADMIN") router.replace("/dashboard/admin");
      else router.replace("/login");
    })();
  }, [router]);
  return null;
}
