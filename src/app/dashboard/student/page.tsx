"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseInstance } from "@/lib/firebase";
import {
  collection, getDocs, doc, addDoc, getDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp
} from "firebase/firestore";
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
import StudentLeaderboard from "@/components/student/StudentLeaderboard";
import NewDailyGoalsFeed from "@/components/goals/NewDailyGoalsFeed";

interface Session {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
  goal_progress_id?: string;
  progress_created_at?: string;
  teacher_feedback?: string;
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
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 통계 데이터
  const [statsData, setStatsData] = useState({
    recentPerformance: [] as { date: string; value: number }[],
    subjectPerformance: [] as { subject: string; average: number }[],
    weekdayFrequency: [] as { day: string; count: number }[]
  });

  // 사용자 이름 로딩 (User row 없으면 자동 생성)
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await getUserName();
        if (name !== null) {
          setUserName(name);
        }
      } catch (error) {
        console.error("사용자 이름 로드 오류:", error);
      }
    };

    fetchUserName();
  }, []);

  // 사용자 역할 확인 및 세션 데이터 로드
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { auth } = getFirebaseInstance();
        const user = auth.currentUser;
        
        if (user) {
          setUserId(user.uid);
        }
        
        const role = await getUserRole();
        setUserRole(role);
        
        if (role === "student") {
          await loadSessions();
        } else if (role && role !== "student") {
          // 학생이 아닌 경우 해당 대시보드로 리디렉션
          router.push(`/dashboard/${role}`);
        }
      } catch (error) {
        console.error("사용자 역할 확인 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  // 세션 데이터 불러오기 (API 호출 방식으로 변경)
  const loadSessions = async () => {
    try {
      setLoading(true);
      const { auth } = getFirebaseInstance();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("사용자가 로그인되어 있지 않습니다.");
      }

      // API를 통한 학생 세션 데이터 조회
      const response = await fetch(`/api/student/get-sessions?user_id=${user.uid}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '세션 데이터를 불러오는 중 오류가 발생했습니다.');
      }
      
      const { sessions: sessionData } = await response.json();

      setSessions(sessionData);
      calculateStats(sessionData);
    } catch (error) {
      console.error("세션 데이터 로드 오류:", error);
      setError("세션 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 계산
  const calculateStats = (sessionData: Session[]) => {
    try {
      // 최근 성과 (최근 10개 세션)
      const recentPerformance = sessionData.slice(0, 10).map(session => ({
        date: new Date(session.created_at).toLocaleDateString(),
        value: session.percent
      })).reverse();

      // 과목별 평균 성과
      const subjectMap: Record<string, { total: number; count: number }> = {};
      sessionData.forEach(session => {
        if (!subjectMap[session.subject]) {
          subjectMap[session.subject] = { total: 0, count: 0 };
        }
        subjectMap[session.subject].total += session.percent;
        subjectMap[session.subject].count += 1;
      });

      const subjectPerformance = Object.entries(subjectMap).map(([subject, { total, count }]) => ({
        subject,
        average: count > 0 ? Math.round(total / count) : 0
      }));

      // 요일별 학습 빈도
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayCount = [0, 0, 0, 0, 0, 0, 0];

      sessionData.forEach(session => {
        const date = new Date(session.created_at);
        const day = date.getDay();
        dayCount[day]++;
      });

      const weekdayFrequency = dayNames.map((day, index) => ({
        day,
        count: dayCount[index]
      }));

      setStatsData({
        recentPerformance,
        subjectPerformance,
        weekdayFrequency
      });
    } catch (error) {
      console.error("통계 계산 오류:", error);
    }
  };

  // 새 세션 추가 핸들러
  const handleAddSession = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      
      if (!newSessionData.subject || !newSessionData.description) {
        setError("모든 필드를 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      const { db, auth } = getFirebaseInstance();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("사용자가 로그인되어 있지 않습니다.");
      }

      const sessionsRef = collection(db, "sessions");
      
      if (editId) {
        // 기존 세션 업데이트
        const sessionRef = doc(db, "sessions", editId);
        await updateDoc(sessionRef, {
          subject: newSessionData.subject,
          description: newSessionData.description,
          updated_at: Timestamp.now()
        });
      } else {
        // 새 세션 추가
        await addDoc(sessionsRef, {
          user_id: user.uid,
          subject: newSessionData.subject,
          description: newSessionData.description,
          percent: 0,
          reflection: "",
          created_at: Timestamp.now()
        });
      }

      // 폼 초기화 및 대화상자 닫기
      setNewSessionData({
        subject: SUBJECTS[0],
        description: ""
      });
      setEditId(null);
      setIsDialogOpen(false);
      
      // 세션 목록 새로고침
      await loadSessions();
    } catch (error) {
      console.error("세션 추가/수정 오류:", error);
      setError("세션을 저장하는 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 세션 삭제 핸들러
  const handleDeleteSession = async (id: string) => {
    try {
      if (!window.confirm("정말로 이 학습 세션을 삭제하시겠습니까?")) {
        return;
      }

      setLoading(true);
      const { db } = getFirebaseInstance();
      const sessionRef = doc(db, "sessions", id);
      
      await deleteDoc(sessionRef);
      await loadSessions();
    } catch (error) {
      console.error("세션 삭제 오류:", error);
      setError("세션을 삭제하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 세션 업데이트 핸들러 - 완료 기록 저장 기능 포함
  const handleUpdateSession = async (sessionId: string, data: any) => {
    try {
      setLoading(true);
      const { db, auth } = getFirebaseInstance();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('사용자가 로그인되어 있지 않습니다.');
      }
      
      console.log('페이지 handleUpdateSession 함수 실행:', { 
        sessionId, 
        data, 
        dataType: typeof data,
        hasPercent: data.percent !== undefined,
        percentType: typeof data.percent,
        hasReflection: data.reflection !== undefined,
        user: user ? user.email : 'null'
      });
      
      // Firebase에서 세션 업데이트
      const sessionRef = doc(db, 'sessions', sessionId);
      
      // 기본 업데이트 데이터 (제목, 설명)
      const updateData: any = {
        subject: data.subject,
        description: data.description,
        updated_at: serverTimestamp()
      };
      
      // 진행률과 반성 데이터가 있는 경우 추가
      if (data.percent !== undefined || data.reflection) {
        updateData.percent = data.percent || 0;
        updateData.reflection = data.reflection || '';
      }
      
      console.log('업데이트할 데이터(최종):', {
        updateData,
        subject: updateData.subject,
        description: updateData.description,
        percent: updateData.percent,
        percentType: typeof updateData.percent,
        reflection: updateData.reflection
      });
      
      // 세션 업데이트
      try {
        console.log('파이어베이스 updateDoc 호출 시작...');
        await updateDoc(sessionRef, updateData);
        console.log('파이어베이스 세션 업데이트 성공!', sessionId);
      } catch (updateError) {
        console.error('파이어베이스 updateDoc 오류:', updateError);
        throw updateError;
      }
      
      // 세션 목록 새로고침
      await loadSessions();
    } catch (error: any) {
      console.error('세션 업데이트 오류:', error);
      setError(`세션을 업데이트하는 중 오류가 발생했습니다: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  // 대화상자 핸들러
  const handleDialogOpen = () => {
    setEditId(null);
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

  // 로딩 상태이거나 역할이 student가 아닌 경우
  if (loading || !userRole || userRole !== "student") {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {userName}님의 학습 대시보드
        </Typography>
        <LogoutButton variant="icon" size="large" />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="대시보드 탭">
          <Tab label="학습 세션" />
          <Tab label="캘린더" />
          <Tab label="통계" />
          <Tab label="AI 조언" />
          <Tab label="🏆 리더보드" />
          <Tab label="🎯 목표 선언" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <SessionManager
            sessions={sessions}
            onDelete={handleDeleteSession}
            onUpdate={handleUpdateSession}
            onRefresh={loadSessions}
          />
        </>
      )}

      {activeTab === 1 && <CalendarView sessions={sessions} />}
      {activeTab === 2 && <StatsView statsData={statsData} />}
      {activeTab === 3 && <AIAdviceView sessions={sessions} />}
      {activeTab === 4 && (
        <StudentLeaderboard 
          currentUserId={userId} 
          userRole={userRole}
        />
      )}
      {activeTab === 5 && (
        <NewDailyGoalsFeed 
          currentUserId={userId} 
          userRole={userRole}
        />
      )}

      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>{editId ? "학습 세션 수정" : "새 학습 세션 추가"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="subject-label">과목</InputLabel>
            <Select
              labelId="subject-label"
              value={newSessionData.subject}
              label="과목"
              onChange={(e) => setNewSessionData({ ...newSessionData, subject: e.target.value })}
            >
              {SUBJECTS.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            label="학습 내용"
            fullWidth
            multiline
            rows={4}
            value={newSessionData.description}
            onChange={(e) => setNewSessionData({ ...newSessionData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>취소</Button>
          <Button
            onClick={handleAddSession}
            disabled={isSubmitting}
            variant="contained"
          >
            {isSubmitting ? <CircularProgress size={24} /> : (editId ? "수정" : "추가")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
