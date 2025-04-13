"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  CardActions, 
  Button, 
  CircularProgress,
  Paper,
  Divider,
  useTheme
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TimelineIcon from "@mui/icons-material/Timeline";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // 테스트 계정으로 직접 로그인하는 함수
  const handleDirectLogin = async () => {
    try {
      console.log('테스트 계정으로 직접 로그인 시도');
      setLoading(true);
      
      // 테스트 계정으로 로그인 시도
      window.location.href = '/admin/dashboard';
    } catch (error) {
      console.error('로그인 실패:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('대시보드 페이지 로딩 - 세션 상태:', status);
    console.log('세션 데이터:', session);
    
    // 세션 로딩 중
    if (status === 'loading') {
      return;
    }
    
    // 사용자가 로그인되어 있고, 세션 로딩이 완료된 경우
    if (status === "authenticated" && session?.user) {
      // 테스트 계정 직접 처리
      if (session.user.email === 'admin@pof.com') {
        console.log('관리자 테스트 계정 처리');
        window.location.href = '/admin/dashboard';
        return;
      }
      
      // 일반 사용자 처리
      const userRole = session.user.role;
      console.log("사용자 역할:", userRole);
      
      // 역할에 따라 적절한 대시보드로 리디렉션
      if (userRole === "ADMIN") {
        console.log("관리자로 리디렉션");
        window.location.href = "/admin/dashboard";
        return;
      } else if (userRole === "TEACHER") {
        console.log("교사로 리디렉션");
        window.location.href = "/teacher/dashboard";
        return;
      }
      
      // STUDENT는 현재 페이지 유지
      console.log('학생 대시보드 표시');
      setLoading(false);
    } else if (status === "unauthenticated") {
      // 로그인되지 않은 경우 로그인 페이지로 리디렉션
      console.log("로그인되지 않음, 로그인 페이지로 이동");
      router.replace("/auth/signin");
    }
  }, [session, status, router]);

  const theme = useTheme();

  // 로딩 중일 때
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.secondary }}>
          대시보드 로딩 중...
        </Typography>
      </Box>
    );
  }
  
  // 개발 환경에서 관리자 페이지로 바로 접근하는 버튼 추가
  if (process.env.NODE_ENV === 'development') {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          p: 3
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            maxWidth: 500, 
            width: '100%',
            textAlign: 'center' 
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            대시보드
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body1" paragraph>
            세션 상태: <strong>{status}</strong>
          </Typography>
          
          <Typography variant="body1" paragraph>
            사용자 정보: <strong>{session?.user?.email || '로그인되지 않음'}</strong>
          </Typography>
          
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleDirectLogin}
              size="large"
              sx={{ 
                py: 1.5,
                background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
                '&:hover': {
                  background: 'linear-gradient(to right, #2563eb, #4338ca)'
                }
              }}
            >
              관리자 페이지로 바로 이동
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => router.push('/auth/signin')}
              size="large"
              sx={{ py: 1.5 }}
            >
              로그인 페이지로 이동
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // 학생용 대시보드
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
        학생 대시보드
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        <Box>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  환영합니다, {session?.user?.name || '학생'}님!
                </Typography>
              }
              subheader={
                <Typography variant="subtitle2" color="text.secondary">
                  역할: {session?.user?.role || '학생'}
                </Typography>
              }
              avatar={<SchoolIcon color="primary" fontSize="large" />}
            />
            <CardContent>
              <Typography variant="body1" paragraph>
                이메일: {session?.user?.email || '정보 없음'}
              </Typography>
              <Typography variant="body1">
                Meta-Cog 학생 대시보드에 오신 것을 환영합니다.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                마지막 로그인: {new Date().toLocaleString()}
              </Typography>
            </CardActions>
          </Card>
        </Box>
        
        <Box>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  학습 기능
                </Typography>
              }
              subheader={
                <Typography variant="subtitle2" color="text.secondary">
                  자주 사용하는 학습 기능
                </Typography>
              }
              avatar={<AssignmentIcon color="primary" fontSize="large" />}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="outlined" startIcon={<TimelineIcon />}>학습 계획 관리</Button>
              <Button variant="outlined" startIcon={<TimelineIcon />}>성취도 분석</Button>
              <Button variant="outlined" startIcon={<MenuBookIcon />}>학습 자료 탐색</Button>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  학습 현황
                </Typography>
              }
              subheader={
                <Typography variant="subtitle2" color="text.secondary">
                  현재 학습 현황
                </Typography>
              }
              avatar={<TimelineIcon color="primary" fontSize="large" />}
            />
            <CardContent>
              <Typography variant="body1" color="success.main" sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                <Box component="span" sx={{ 
                  display: 'inline-block', 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: 'success.main', 
                  mr: 1 
                }} />
                정상 진행 중
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                세션 ID: {session?.user?.id || '정보 없음'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
  

} 