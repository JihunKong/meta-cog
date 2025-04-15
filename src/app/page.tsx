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

            justifyContent: 'center'
          }}>
            <div style={{
              flex: '1 1 300px',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'white'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold', color: '#3f51b5' }}>
                학생용 기능
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                자신의 학습 데이터를 분석하고 인지 학습 패턴을 파악하여 학습 효율을 극대화하세요.
              </p>
            </div>
            
            <div style={{
              flex: '1 1 300px',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'white'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold', color: '#f44336' }}>
                교사용 기능
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                학생들의 학습 패턴을 한눈에 파악하고 개인화된 피드백을 제공하세요.
              </p>
            </div>
            
            <div style={{
              flex: '1 1 300px',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'white'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold', color: '#4caf50' }}>
                관리자용 기능
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                전체 시스템을 관리하고 사용자 권한을 설정하세요.
              </p>
            </div>
          </div>
        </section>
        
        <section style={{
          background: '#f5f5f5',
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
