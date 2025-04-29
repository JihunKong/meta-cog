"use client";
import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/auth';

export default function CreateTestDataPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  
  // 컴포넌트 마운트 시 사용자 권한 확인
  React.useEffect(() => {
    async function checkRole() {
      try {
        const role = await getUserRole();
        setUserRole(role);
        
        // 관리자나 교사가 아니면 대시보드로 리다이렉트
        if (role !== 'admin' && role !== 'teacher') {
          router.push('/dashboard/' + role);
        }
      } catch (err) {
        setError('권한을 확인하는 중 오류가 발생했습니다.');
      }
    }
    
    checkRole();
  }, [router]);
  
  async function handleCreateTestStudents() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('인증된 사용자가 없습니다.');
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch('/api/create-test-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '테스트 학생 데이터 생성 중 오류가 발생했습니다.');
      }
      
      setResult(data);
      
    } catch (err: any) {
      setError(err.message || '테스트 학생 데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }
  
  // 관리자나 교사가 아니면 권한 없음 표시
  if (userRole !== null && userRole !== 'admin' && userRole !== 'teacher') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          이 페이지에 접근할 권한이 없습니다. 관리자나 교사만 접근할 수 있습니다.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        테스트 데이터 생성
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          테스트 학생 데이터 생성
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          이 기능은 테스트를 위한 학생 계정을 자동으로 생성합니다. 기본 비밀번호는 'password123'입니다.
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={handleCreateTestStudents}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : '테스트 학생 데이터 생성'}
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              {result.message}
            </Alert>
            <Box sx={{ mt: 2, maxHeight: '300px', overflow: 'auto' }}>
              <pre>{JSON.stringify(result.results, null, 2)}</pre>
            </Box>
          </Box>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/dashboard/' + userRole)}
        >
          대시보드로 돌아가기
        </Button>
      </Box>
    </Box>
  );
}
