import React from 'react';

export default function Home() {
  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      color: '#333'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#3f51b5'
        }}>
          Meta-Cog
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          인지 학습 분석 플랫폼
        </p>
      </header>
      
      <main>
        <section style={{
          background: '#3f51b5',
          color: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          marginBottom: '3rem',
          boxShadow: '0 10px 25px rgba(92, 107, 192, 0.2)'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
              인지 학습의 미래
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Meta-Cog는 학습자의 인지 과정을 분석하여 최적의 학습 경험을 제공합니다.
              학습 데이터를 기반으로 개인화된 학습 경로를 제시하고, 교사와 학생 모두에게
              유용한 인사이트를 제공합니다.
            </p>
          </div>
        </section>
        
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '2rem',
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#3f51b5',
            fontWeight: 'bold'
          }}>
            주요 기능
          </h2>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
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
