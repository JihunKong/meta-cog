"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth";
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    subject: SUBJECTS[0],
    description: ""
  });
  const [editId, setEditId] = useState<string | null>(null);

  // 통계 데이터
  const [statsData, setStatsData] = useState({
    recentPerformance: [] as { date: string; value: number }[],
    subjectPerformance: [] as { subject: string; average: number }[],
    weekdayFrequency: [] as { day: string; count: number }[]
  });

  // 이제 메타데이터를 데이터베이스에 저장하므로 로컬 스토리지 사용 중단

  // 사용자 권한 확인
  useEffect(() => {
    const checkRole = async () => {
      try {
        const role = await getUserRole();
        if (role === "TEACHER") {
          router.push("/dashboard/teacher");
          return;
        }
        if (role === "ADMIN") {
          router.push("/dashboard/admin");
          return;
        }
        if (role !== "STUDENT") {
          router.push("/login");
          return;
        }
        setUserRole(role);
      } catch (error) {
        console.error("권한 확인 오류:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [router]);

  // 세션 데이터 로드
  useEffect(() => {
    if (userRole) {
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
      const { data, error } = await supabase
        .from('smart_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('smart_goals')
        .insert([
          {
            subject: newSessionData.subject,
            description: newSessionData.description,
          }
        ])
        .select();

      if (error) throw error;

      // 이제 데이터베이스에 전부 저장되민플 결과만 상태로 업데이트
      if (data && data.length > 0) {
        setSessions([data[0], ...sessions]);
      }

      handleDialogClose();
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">학생 대시보드</Typography>
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
