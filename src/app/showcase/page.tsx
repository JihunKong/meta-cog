"use client";

import React from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Button, Chip, Avatar, LinearProgress, Tab, Tabs,
  Paper, IconButton, Fade, Zoom, useTheme
} from '@mui/material';
import {
  School, EmojiEvents, TrendingUp, Psychology,
  Group, ChatBubble, Favorite, Timer,
  Dashboard, Assignment, Insights, Security
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function ProductShowcase() {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState(0);

  const features = [
    {
      icon: <School fontSize="large" />,
      title: '자기주도 학습',
      description: '학생 스스로 목표를 설정하고 학습 과정을 관리합니다',
      color: '#4CAF50'
    },
    {
      icon: <EmojiEvents fontSize="large" />,
      title: '게임화 요소',
      description: '리더보드와 보상 시스템으로 학습 동기를 높입니다',
      color: '#FF9800'
    },
    {
      icon: <TrendingUp fontSize="large" />,
      title: '성장 추적',
      description: '상세한 통계와 분석으로 학습 성장을 시각화합니다',
      color: '#2196F3'
    },
    {
      icon: <Psychology fontSize="large" />,
      title: 'AI 학습 조언',
      description: '개인별 학습 패턴을 분석해 맞춤형 조언을 제공합니다',
      color: '#9C27B0'
    }
  ];

  const userTypes = [
    {
      avatar: '👨‍🎓',
      title: '학생',
      features: ['일일 목표 설정', '학습 세션 기록', '친구와 경쟁', 'AI 조언'],
      color: '#3F51B5'
    },
    {
      avatar: '👩‍🏫',
      title: '교사',
      features: ['학급 모니터링', '개별 피드백', '학습 분석', '보고서 생성'],
      color: '#009688'
    },
    {
      avatar: '👨‍💼',
      title: '관리자',
      features: ['시스템 관리', '사용자 권한', '데이터 분석', '플랫폼 설정'],
      color: '#795548'
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 10,
          textAlign: 'center'
        }}
      >
        <Container>
          <Fade in timeout={1000}>
            <Typography variant="h2" gutterBottom fontWeight="bold">
              메타인지 학습의 새로운 시작
            </Typography>
          </Fade>
          <Fade in timeout={1500}>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              학생, 교사, 학부모가 함께하는 스마트 교육 플랫폼
            </Typography>
          </Fade>
          <Fade in timeout={2000}>
            <Box>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/login')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                무료로 시작하기
              </Button>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold">
          핵심 기능
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          메타인지 학습을 위한 완벽한 도구들
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Zoom in timeout={500 + index * 200}>
                <Card 
                  sx={{ 
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: feature.color,
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Demo Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container>
          <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold">
            실제 화면 미리보기
          </Typography>
          
          <Paper sx={{ mt: 4, p: 2 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} centered>
              <Tab label="학생 대시보드" />
              <Tab label="목표 선언 광장" />
              <Tab label="교사 대시보드" />
            </Tabs>
            
            <Box sx={{ p: 4 }}>
              {activeTab === 0 && (
                <Fade in>
                  <Box>
                    <Typography variant="h5" gutterBottom>오늘의 학습 현황</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ p: 2, textAlign: 'center' }}>
                          <Timer sx={{ fontSize: 40, color: 'primary.main' }} />
                          <Typography variant="h4">2시간 30분</Typography>
                          <Typography color="text.secondary">오늘의 학습 시간</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ p: 2, textAlign: 'center' }}>
                          <Assignment sx={{ fontSize: 40, color: 'success.main' }} />
                          <Typography variant="h4">3개</Typography>
                          <Typography color="text.secondary">완료한 세션</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ p: 2, textAlign: 'center' }}>
                          <EmojiEvents sx={{ fontSize: 40, color: 'warning.main' }} />
                          <Typography variant="h4">85%</Typography>
                          <Typography color="text.secondary">목표 달성률</Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}
              
              {activeTab === 1 && (
                <Fade in>
                  <Box>
                    <Typography variant="h5" gutterBottom>친구들의 목표</Typography>
                    <Card sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar>김</Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            김철수
                          </Typography>
                          <Typography>오늘은 수학 문제집 30문제를 풀어보겠습니다!</Typography>
                        </Box>
                        <Box>
                          <IconButton color="error">
                            <Favorite />
                          </IconButton>
                          <IconButton>
                            <ChatBubble />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                    <Card sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar>이</Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            이영희
                          </Typography>
                          <Typography>영어 단어 50개 암기 도전!</Typography>
                        </Box>
                        <Box>
                          <IconButton>
                            <Favorite />
                          </IconButton>
                          <IconButton>
                            <ChatBubble />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                </Fade>
              )}
              
              {activeTab === 2 && (
                <Fade in>
                  <Box>
                    <Typography variant="h5" gutterBottom>학급 현황</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>학생별 학습 시간</Typography>
                          <Box sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography>김철수</Typography>
                              <Typography>3시간 20분</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={85} />
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography>이영희</Typography>
                              <Typography>2시간 45분</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={70} />
                          </Box>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>오늘의 통계</Typography>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography>평균 학습 시간</Typography>
                            <Typography fontWeight="bold">2시간 15분</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography>목표 달성률</Typography>
                            <Typography fontWeight="bold">78%</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography>활동 학생</Typography>
                            <Typography fontWeight="bold">24/30명</Typography>
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* User Types Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold">
          사용자별 맞춤 기능
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {userTypes.map((user, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Zoom in timeout={700 + index * 200}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 4,
                    border: `2px solid ${user.color}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 8,
                      borderColor: user.color
                    }
                  }}
                >
                  <Typography variant="h1" sx={{ mb: 2 }}>
                    {user.avatar}
                  </Typography>
                  <Typography variant="h4" gutterBottom fontWeight="bold" color={user.color}>
                    {user.title}
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    {user.features.map((feature, idx) => (
                      <Chip
                        key={idx}
                        label={feature}
                        sx={{ m: 0.5 }}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container>
          <Typography variant="h3" gutterBottom fontWeight="bold">
            지금 바로 시작하세요
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            더 나은 학습 경험이 여러분을 기다립니다
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/login')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 5,
              py: 2,
              fontSize: '1.2rem',
              '&:hover': {
                bgcolor: 'grey.100',
                transform: 'scale(1.05)',
                boxShadow: 6
              }
            }}
          >
            무료 체험 시작하기
          </Button>
        </Container>
      </Box>
    </Box>
  );
}