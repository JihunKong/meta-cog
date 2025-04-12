"use client";

import { User } from "next-auth";
import StudentsList from "@/components/teacher/StudentsList";

interface StudentsClientProps {
  user: User & {
    role: string;
    student_id?: string | null;
  };
}

export default function StudentsClient({ user }: StudentsClientProps) {
  return <StudentsList user={user} />;
} 