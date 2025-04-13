"use client";

import StudentsClient from "./StudentsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  if (session.user.role !== "TEACHER") {
    redirect("/");
  }
  
  return <StudentsClient user={session.user} />;
} 