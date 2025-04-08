import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Metadata } from "next";

interface WithAdminAuthOptions {
  metadata?: Metadata;
}

export function withAdminAuth(
  Component: React.ComponentType<any>,
  options: WithAdminAuthOptions = {}
) {
  return async function AdminProtectedPage(props: any) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      redirect("/auth/login");
    }

    if (session.user.role !== "ADMIN") {
      redirect("/dashboard");
    }

    return <Component {...props} />;
  };
} 