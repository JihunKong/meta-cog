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
    };
  }

  interface User {
    role: UserRole;
    student_id?: string | null;
  }
} 