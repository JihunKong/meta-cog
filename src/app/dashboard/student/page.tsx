"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Alert, Tab, Tabs
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import SessionList from "@/components/student/session/SessionList";

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
  // 세션 관련 상태
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    subject: SUBJECTS[0],
    description: "",
    percent: "",
    reflection: ""
  });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 탭 관련 상태
  const [activeTab, setActiveTab] = useState(0);

  const router = useRouter();

  // 권한 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const role = await getUserRole();
        if (!role) {
          router.push("/login");
          return;
        }
      } catch (e) {
        console.error(e);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // 세션 불러오기
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // smart_goals 테이블을 학습 세션(목표) 테이블로 활용
      const { data, error: fetchError } = await supabase
        .from("smart_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      
      // 로컬 스토리지에서 세션 메타데이터 가져오기
      let sessionData = data || [];
      
      // 클라이언트 환경에서만 로컬 스토리지 사용 가능
      if (typeof window !== 'undefined') {
        const metadataString = localStorage.getItem('sessionMetadata');
        if (metadataString) {
          try {
            const metadataMap = JSON.parse(metadataString);
            
            // 각 세션에 메타데이터 추가
            sessionData = sessionData.map(session => {
              const metadata = metadataMap[session.id];
              if (metadata) {
                return {
                  ...session,
                  percent: metadata.percent,
                  reflection: metadata.reflection
                };
              }
              return session;
            });
          } catch (e) {
            console.error('Failed to parse session metadata:', e);
          }
        }
      }
      
      setSessions(sessionData);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "세션을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 세션 추가 폼 초기화
  const openNewSessionForm = () => {
    setSessionForm({
      subject: SUBJECTS[0],
      description: "",
      percent: "",
      reflection: ""
    });
    setNewSessionOpen(true);
  };

  // 세션 추가
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.subject || !sessionForm.description) return;

    try {
      setSaveLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 새 세션 추가 (smart_goals 테이블 활용)
      const { error } = await supabase
        .from("smart_goals")
        .insert({ 
          user_id: user.id, 
          subject: sessionForm.subject, 
          description: sessionForm.description
        });

      if (error) throw error;

      setNewSessionOpen(false);
      fetchSessions();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "세션 추가 중 오류가 발생했습니다.");
    } finally {
      setSaveLoading(false);
    }
  };

  // 세션 수정 폼 열기
  const handleEditSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSessionForm({
        subject: session.subject,
        description: session.description,
        percent: session.percent ? session.percent.toString() : "",
        reflection: session.reflection || ""
      });
      setEditingSessionId(sessionId);
    }
  };

  // 세션 수정 폼 닫기
  const closeEdit = () => {
    setEditingSessionId(null);
  };

  // 세션 저장
  const handleSaveSession = async (sessionId: string, data: {
    subject: string;
    description: string;
    percent: string;
    reflection: string;
  }) => {
    try {
      setSaveLoading(true);

      const percent = parseInt(data.percent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        throw new Error("달성도는 0-100 사이의 숫자여야 합니다.");
      }

      // 세션 기본 정보 업데이트 (smart_goals 테이블 활용)
      const { error } = await supabase
        .from("smart_goals")
        .update({
          subject: data.subject,
          description: data.description
        })
        .eq("id", sessionId);
        
      // 달성도와 반성은 로컬 스토리지에 저장
      const sessionMetadata = {
        percent: parseInt(data.percent),
        reflection: data.reflection
      };
      
      // 로컬 스토리지에 세션 메타데이터 저장
      const existingData = localStorage.getItem('sessionMetadata');
      const metadataMap = existingData ? JSON.parse(existingData) : {};
      metadataMap[sessionId] = sessionMetadata;
      localStorage.setItem('sessionMetadata', JSON.stringify(metadataMap));

      if (error) throw error;

      setEditingSessionId(null);
      fetchSessions();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "세션 저장 중 오류가 발생했습니다.");
    } finally {
      setSaveLoading(false);
    }
  };

  // 세션 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!deleteSessionId) return;

    try {
      setDeleteLoading(true);

      // 세션 삭제 (smart_goals 테이블에서 삭제)
      const { error } = await supabase
        .from("smart_goals")
        .delete()
        .eq("id", deleteSessionId);

      if (error) throw error;

      // 로컬 스토리지에서 해당 세션 메타데이터 삭제
      if (typeof window !== 'undefined') {
        const metadataString = localStorage.getItem('sessionMetadata');
        if (metadataString) {
          try {
            const metadataMap = JSON.parse(metadataString);
            if (metadataMap[deleteSessionId]) {
              delete metadataMap[deleteSessionId];
              localStorage.setItem('sessionMetadata', JSON.stringify(metadataMap));
            }
          } catch (e) {
            console.error('Failed to delete session metadata:', e);
          }
        }
      }

      fetchSessions();
      setDeleteSessionId(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "세션 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // 통계 데이터 계산
  const statsData = {
    // 요일별 학습 빈도
    weekdayFrequency: (() => {
      const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
      const frequency = weekdays.reduce((acc, day) => ({ ...acc, [day]: 0 }), {} as Record<string, number>);
      
      // 최근 4주간 데이터만 필터링
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      sessions.forEach(session => {
        const date = new Date(session.created_at);
        if (date >= fourWeeksAgo) {
          const day = weekdays[date.getDay()];
          frequency[day]++;
        }
      });
      
      return weekdays.map(day => ({
        day,
        count: frequency[day]
      }));
    })(),
    
    // 과목별 달성률
    subjectPerformance: (() => {
      const subjectData: Record<string, {count: number, total: number}> = {};
      
      sessions.forEach(session => {
        if (session.percent) {
          if (!subjectData[session.subject]) {
            subjectData[session.subject] = { count: 0, total: 0 };
          }
          subjectData[session.subject].count++;
          subjectData[session.subject].total += session.percent;
        }
      });
      
      return Object.entries(subjectData).map(([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count)
      }));
    })(),
    
    // 최근 달성률 추이
    recentPerformance: (() => {
      return sessions
        .filter(session => session.percent)
        .slice(0, 10)
        .map(session => ({
          date: new Date(session.created_at).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric"
          }),
          percent: session.percent,
          subject: session.subject
        }))
        .reverse();
    })()
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>메타인지 학습 시스템</Typography>
        <LogoutButton />
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="학습 세션" />
        <Tab label="통계 및 분석" />
      </Tabs>
      
      {activeTab === 0 ? (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 0 }}>학습 세션 관리</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={openNewSessionForm}
              sx={{ fontWeight: "bold" }}
            >
              학습 세션 추가
            </Button>
          </Box>
          
          <SessionList
            sessions={sessions}
            loading={loading}
            error={error}
            handleAddSession={openNewSessionForm}
            handleEditSession={handleEditSession}
            handleSaveSession={handleSaveSession}
            handleDeleteSession={setDeleteSessionId}
            editingSessionId={editingSessionId}
            saveLoading={saveLoading}
            closeEdit={closeEdit}
          />
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>통계 및 학습 분석</Typography>
          
          {sessions.filter(s => s.percent).length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              아직 완료된 학습 세션이 없습니다. 학습을 완료하고 통계를 확인해보세요.
            </Alert>
          ) : (
            <Grid container spacing={4}>
              {/* 최근 달성률 추이 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>최근 달성률 추이</Typography>
                <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData.recentPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="percent" stroke="#1976d2" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              {/* 과목별 평균 달성률 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>과목별 평균 달성률</Typography>
                <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.subjectPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="average" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              {/* 요일별 학습 빈도 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>최근 4주간 요일별 학습 빈도</Typography>
                <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.weekdayFrequency}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1976d2" name="학습 횟수" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      {/* 새 세션 추가 모달 */}
      <Dialog open={newSessionOpen} onClose={() => !saveLoading && setNewSessionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>학습 세션 추가</DialogTitle>
        <form onSubmit={handleAddSession}>
          <DialogContent>
            <TextField
              label="과목"
              value={sessionForm.subject}
              onChange={(e) => setSessionForm(prev => ({ ...prev, subject: e.target.value }))}
              select
              fullWidth
              margin="normal"
              required
            >
              {SUBJECTS.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="학습 목표"
              value={sessionForm.description}
              onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              margin="normal"
              required
              multiline
              rows={3}
              placeholder="오늘의 학습 목표를 설정하세요"
              helperText="구체적이고 측정 가능한 목표를 설정하세요"
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                학습 세션을 추가한 후, 세션 관리 화면에서 학습 달성도와 반성을 입력할 수 있습니다.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewSessionOpen(false)} disabled={saveLoading}>취소</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saveLoading}>
              {saveLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* 세션 삭제 확인 모달 */}
      <Dialog open={Boolean(deleteSessionId)} onClose={() => !deleteLoading && setDeleteSessionId(null)} maxWidth="xs">
        <DialogTitle>세션 삭제</DialogTitle>
        <DialogContent>
          <Typography>이 학습 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSessionId(null)} disabled={deleteLoading}>취소</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
