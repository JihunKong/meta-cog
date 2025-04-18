"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseAdmin, testSupabaseConnection } from "@/lib/supabase";
import { getUserRole, getUserName } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import {
  Box, Container, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, TextField, MenuItem, CircularProgress, Alert, Tab, Tabs
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SessionManager from "@/components/student/session/SessionManager";
import CalendarView from "@/components/student/CalendarView";
import StatsView from "@/components/student/StatsView";
import AIAdviceView from "@/components/student/AIAdviceView";

interface Session {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
}

const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    subject: SUBJECTS[0],
    description: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수파베이스 연결 테스트 (페이지 로드 시 한 번만 실행)
  useEffect(() => {
    const testConnection = async () => {
      console.log("Supabase 연결 테스트 시작...");
      const result = await testSupabaseConnection();
      console.log("Supabase 연결 테스트 결과:", result);
    };
    
    testConnection();
  }, []);

  // 사용자 이름 로딩 (User row 없으면 자동 생성)
  useEffect(() => {
    const fetchUserName = async () => {
      const name = await getUserName();
      if (name) setUserName(name);
    };
    fetchUserName();
  }, []);

  // 통계 데이터
  const [statsData, setStatsData] = useState({
    recentPerformance: [] as { date: string; value: number }[],
    subjectPerformance: [] as { subject: string; average: number }[],
    weekdayFrequency: [] as { day: string; count: number }[]
  });

  // 이제 메타데이터를 데이터베이스에 저장하므로 로컬 스토리지 사용 중단

  // 사용자 권한 확인
  useEffect(() => {
    let mounted = true; // 컴포넌트 마운트 상태 추적
    
    const checkRole = async () => {
      try {
        const role = await getUserRole();
        
        // 컴포넌트가 언마운트된 경우 상태 업데이트 중단
        if (!mounted) return;
        
        console.log('학생 대시보드 - 역할 확인:', role, typeof role);
        
        // 소문자로 비교 (enum 타입 대응) + 즉시 리디렉션
        if (role === "teacher") {
          console.log('교사 계정 -> 교사 대시보드로 이동');
          window.location.replace("/dashboard/teacher");
          return;
        }
        if (role === "admin") {
          console.log('관리자 계정 -> 관리자 대시보드로 이동');
          window.location.replace("/dashboard/admin");
          return;
        }
        if (role !== "student") {
          console.log('학생 아닌 계정 -> 로그인으로 이동');
          window.location.replace("/login");
          return;
        }
        
        // student 역할인 경우만 상태 업데이트
        setUserRole(role);
        console.log('학생 계정 확인 완료, 학생 대시보드 로드');
        setLoading(false);
      } catch (error) {
        console.error("권한 확인 오류:", error);
        if (mounted) {
          window.location.replace("/login");
        }
      }
    };
    
    checkRole();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      mounted = false;
    };
  }, []);

  // 세션 데이터 로드 (학생만)
  useEffect(() => {
    if (userRole === "student") {
      fetchSessions();
    }
  }, [userRole]);

  // 통계 데이터 계산
  useEffect(() => {
    if (sessions.length > 0) {
      calculateStats();
    }
  }, [sessions]);

  // 세션 데이터 가져오기
  const fetchSessions = async () => {
    try {
      // 현재 로그인한 사용자의 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("사용자 정보가 없습니다.");
        return;
      }

      console.log("세션 데이터 요청 중 - 사용자 ID:", user.id);
      console.log("사용자 ID 타입:", typeof user.id); // 사용자 ID 타입 확인
      
      try {
        // API 라우트를 통해 데이터 가져오기
        console.log(`API 요청 URL: /api/sessions?userId=${encodeURIComponent(user.id)}`);
        
        const response = await fetch(`/api/sessions?userId=${encodeURIComponent(user.id)}`);
        
        console.log("세션 API 응답 상태 코드:", response.status);
        
        const result = await response.json();
        console.log("세션 API 응답:", { success: result.success, error: result.error, details: result.details });
        
        if (!response.ok) {
          console.error("세션 API 오류:", result.error, result.details);
          throw new Error(result.error || '세션 데이터 로드 실패');
        }
        
        // 통합 세션 데이터로 변환
        const sessions = (result.data || []).map((row: any) => {
          const progress = Array.isArray(row.goal_progress) && row.goal_progress.length > 0 ? row.goal_progress[0] : {};
          return {
            id: row.id,
            user_id: row.user_id,
            subject: row.subject,
            description: row.description,
            percent: progress.percent ?? 0,
            reflection: progress.reflection ?? '',
            created_at: row.created_at,
            goal_progress_id: progress.id,
            progress_created_at: progress.created_at
          };
        });
        
        console.log("변환된 세션 데이터:", { count: sessions.length });
        setSessions(sessions);
      } catch (apiError) {
        console.error("세션 API 호출 오류:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error("세션 데이터 로드 오류:", error);
    }
  };

  // 통계 데이터 계산
  const calculateStats = () => {
    // 최근 달성률 계산 (이제 데이터베이스에서 percent 값 사용)
    const recentSessionsData = [...sessions]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-10)
      .map(session => {
        // 로컬 스토리지 대신 데이터베이스에서 percent 값 사용
        return {
          date: new Date(session.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          value: session.percent || 0
        };
      });

    // 과목별 평균 달성률 계산 (이제 데이터베이스에서 percent 값 사용)
    const subjectData: Record<string, { total: number; count: number }> = {};
    sessions.forEach(session => {
      // 로컬 스토리지 대신 데이터베이스에서 percent 값 사용
      if (!subjectData[session.subject]) {
        subjectData[session.subject] = { total: 0, count: 0 };
      }
      subjectData[session.subject].total += session.percent || 0;
      subjectData[session.subject].count += 1;
    });

    const subjectPerformanceData = Object.keys(subjectData).map(subject => ({
      subject,
      average: Math.round(subjectData[subject].total / subjectData[subject].count) || 0
    }));

    // 요일별 학습 빈도 계산
    const weekdayCount: Record<string, number> = {
      '일': 0, '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0
    };

    sessions.forEach(session => {
      const date = new Date(session.created_at);
      const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' }).slice(0, 1);
      weekdayCount[weekday] += 1;
    });

    const weekdayFrequencyData = Object.keys(weekdayCount).map(day => ({
      day,
      count: weekdayCount[day]
    }));

    setStatsData({
      recentPerformance: recentSessionsData,
      subjectPerformance: subjectPerformanceData,
      weekdayFrequency: weekdayFrequencyData
    });
  };

  // 새 세션 추가 핸들러
  const handleAddSession = async () => {
    setIsSubmitting(true);
    try {
      // 현재 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      console.log("현재 사용자:", user);
      
      if (!user) {
        console.error("사용자 정보를 가져올 수 없습니다.");
        return;
      }
      
      // 세션 데이터 로깅
      console.log("추가할 세션 데이터:", {
        user_id: user.id,
        subject: newSessionData.subject,
        description: newSessionData.description
      });
      
      // 사용자 정보 상세 확인
      console.log("현재 사용자 상세 정보:", {
        id: user.id,
        email: user.email,
        idType: typeof user.id,
        authTime: user.app_metadata?.provider,
        created_at: user.created_at
      });
      
      // 서버 API 라우트를 통한 데이터 삽입 (서비스 역할 키 사용)
      console.log("서버 API 호출 시작");
      
      let result;
      
      try {
        // 요청 데이터 로깅
        const requestData = {
          user_id: user.id,
          subject: newSessionData.subject,
          description: newSessionData.description
        };
        console.log("요청 데이터:", requestData);
        console.log("사용자 ID 타입:", typeof user.id);
        
        // API 호출
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
        
        console.log("응답 상태 코드:", response.status);
        console.log("응답 헤더:", Object.fromEntries([...response.headers.entries()]));
        
        result = await response.json();
        console.log("서버 API 응답:", result);
        
        if (!response.ok) {
          console.error("서버 API 오류:", result.error);
          throw new Error(result.error || '세션 추가 실패');
        }
      } catch (apiError) {
        console.error("서버 API 호출 중 예외 발생:", apiError);
        throw apiError;
      }
      
      if (result && result.success) {
        // DB에서 세션 목록 새로고침
        await fetchSessions();
        console.log("세션 추가 성공!");
        
        // 대화상자 닫기
        handleDialogClose();
      } else if (result) {
        console.error('세션 추가 실패:', result);
      }
    } catch (error) {
      console.error("세션 추가 오류:", error);
    } finally {
      setLoading(false);
    }
  };


  // 세션 삭제 핸들러
  const handleDeleteSession = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('smart_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 로컬 상태만 업데이트 (데이터베이스에서는 이미 삭제됨)
      setSessions(sessions.filter(s => s.id !== id));
    } catch (error) {
      console.error("세션 삭제 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 세션 업데이트 핸들러
  const handleUpdateSession = async (session: Session) => {
    try {
      setLoading(true);
      // 기본 세션 정보 업데이트
      const { error } = await supabase
        .from('smart_goals')
        .update({
          subject: session.subject,
          description: session.description
        })
        .eq('id', session.id);

      if (error) throw error;

      // 로컬 상태만 업데이트 (데이터베이스는 이미 업데이트 됨)
      setSessions(sessions.map(s => s.id === session.id ? session : s));

      setEditId(null);
    } catch (error) {
      console.error("세션 업데이트 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 대화상자 핸들러
  const handleDialogOpen = () => {
    setNewSessionData({
      subject: SUBJECTS[0],
      description: ""
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 로딩 상태이거나 역할이 student가 아닔
  if (loading || !userRole || userRole !== "student") {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1">학생 대시보드</Typography>
          {userName && (
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              {userName}님! 환영합니다.
              <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '5px' }}>
                (ID: {userName.includes('@') ? userName.split('@')[0] : userName})
              </span>
            </Typography>
          )}
        </Box>
        <LogoutButton />
      </Box>

      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="학습 세션 관리" />
          <Tab label="달력 뷰" />
          <Tab label="통계 및 분석" />
          <Tab label="AI 어드바이스" />
        </Tabs>
      </Box>

      {/* 탭 1: 학습 세션 목록 */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">일자별 학습 기록</Typography>
  
          </Box>

          <SessionManager 
            sessions={sessions} 
            setSessions={setSessions}
          />
        </Box>
      )}

      {/* 탭 2: 달력 뷰 */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>일자별 학습 활동</Typography>
          <CalendarView sessions={sessions} />
        </Box>
      )}

      {/* 탭 3: 통계 및 분석 */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>학습 통계 및 분석</Typography>
          {sessions.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              아직 등록된 학습 세션이 없습니다. 학습 세션을 추가해보세요.
            </Alert>
          ) : (
            <StatsView statsData={statsData} />
          )}
        </Box>
      )}

      {/* 탭 4: AI 어드바이스 */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>AI 학습 조언</Typography>
          <AIAdviceView sessions={sessions} />
        </Box>
      )}
    </Container>
  );
}
