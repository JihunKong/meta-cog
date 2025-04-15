"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const role = await getUserRole();
      if (!role) {
        router.replace("/login");
      } else {
        router.replace("/dashboard");
      }
    })();
  }, [router]);
  return null;
}