"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const role = await getUserRole();
      if (!role) {
        router.replace("/login");
      } else if (role === "STUDENT") {
        router.replace("/dashboard/student");
      } else if (role === "TEACHER") {
        router.replace("/dashboard/teacher");
      } else if (role === "ADMIN") {
        router.replace("/dashboard/admin");
      } else {
        router.replace("/dashboard");
      }
    })();
  }, [router]);
  return null;
}
}}          background: '#f5f5f5',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2rem',
            marginBottom: '1.5rem',
            color: '#333',
            fontWeight: 'bold'
          }}>
            지금 바로 시작하세요
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto 2rem auto',
            lineHeight: 1.6
          }}>
            Meta-Cog와 함께 더 효과적인 학습 경험을 만들어보세요.
          </p>
        </section>
      </main>
      
      <footer style={{
        marginTop: '4rem',
        paddingTop: '2rem',
        borderTop: '1px solid #eee',
        color: '#666',
        textAlign: 'center'
      }}>
        <p>© 2025 Meta-Cog. All rights reserved.</p>
      </footer>
    </div>
  );
}
