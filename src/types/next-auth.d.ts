import { UserRole } from "./index";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      student_id?: string | null;
      isTest?: boolean; // 테스트 계정 여부
    };
  }

  interface User {
    role: UserRole;
    student_id?: string | null;
    isTest?: boolean; // 테스트 계정 여부
  }
} 