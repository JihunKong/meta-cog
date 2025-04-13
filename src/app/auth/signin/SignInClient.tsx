"use client";

import SignInForm from "@/components/auth/SignInForm";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  useTheme
} from "@mui/material";
import SchoolIcon from '@mui/icons-material/School';

// SearchParams를 사용하는 컴포넌트를 별도로 분리
function SearchParamsWrapper() {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  
  // SignInForm이 callbackUrl prop을 받을 수 있는지 확인해야 함
  return <SignInForm callbackUrl={callbackUrl} />;
}

export default function SignInClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  
  // 테스트 계정으로 자동 로그인 (개발 환경에서만 사용)
  const handleTestLogin = () => {
    router.push('/dashboard');
  };
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 6,
        px: 2,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(to bottom right, #1a237e, #000000)' 
          : 'linear-gradient(to bottom right, #e3f2fd, #ffffff)'
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 6
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 1 }} />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              Meta-Cog
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            관리자가 발급한 계정으로 로그인하세요
          </Typography>
          
          <Suspense fallback={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                로그인 폼 로딩 중...
              </Typography>
            </Box>
          }>
            <SearchParamsWrapper />
          </Suspense>
          
          {/* 개발 환경에서만 표시되는 테스트 로그인 버튼 */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              onClick={handleTestLogin}
              color="primary"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              관리자 대시보드로 바로 이동
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 