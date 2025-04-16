"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import {
  Box, Typography, Button, List, ListItem, ListItemText, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import GoalItem from "@/components/student/GoalItem";

interface SmartGoal {
  id: string;
  subject: string;
  description: string;
  created_at: string;
}

interface GoalSession {
  id: string;
  goal_id: string;
  session_no: number;
  percent: number;
  reflection: string;
  created_at: string;
}

const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function StudentDashboard() {
  // SMART 목표 및 기타 상태
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 세션 관련 상태
  const [sessions, setSessions] = useState<Record<string, GoalSession[]>>({});
  const [sessionLoading, setSessionLoading] = useState<Record<string, boolean>>({});
  const [sessionError, setSessionError] = useState<Record<string, string>>({});
  const [sessionEdit, setSessionEdit] = useState<{ goalId: string; sessionNo: number } | null>(null);
  const [sessionForm, setSessionForm] = useState({ percent: "", reflection: "" });
  const [sessionSaveLoading, setSessionSaveLoading] = useState(false);
  const [openReflectionGoalId, setOpenReflectionGoalId] = useState<string | null>(null);
  const [openProgressGoalId, setOpenProgressGoalId] = useState<string | null>(null);

  const router = useRouter();

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

  // 목표 불러오기
  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const { data, error: fetchError } = await supabase
        .from("smart_goals")
        .select()
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setGoals(data || []);

      // 각 목표별 세션 데이터 로드
      if (data && data.length > 0) {
        data.forEach(goal => fetchSessions(goal.id));
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "목표를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 목표별 세션 불러오기
  const fetchSessions = async (goalId: string) => {
    try {
      setSessionLoading(prev => ({ ...prev, [goalId]: true }));
      setSessionError(prev => ({ ...prev, [goalId]: "" }));

      const { data, error: fetchError } = await supabase
        .from("goal_sessions")
        .select()
        .eq("goal_id", goalId)
        .order("session_no", { ascending: true });

      if (fetchError) throw fetchError;

      setSessions(prev => ({ ...prev, [goalId]: data || [] }));
    } catch (e: any) {
      console.error(e);
      setSessionError(prev => ({ ...prev, [goalId]: e.message || "세션을 불러오는 중 오류가 발생했습니다." }));
    } finally {
      setSessionLoading(prev => ({ ...prev, [goalId]: false }));
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // 목표 추가/수정
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    try {
      setAddLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      if (editId) {
        // 수정
        const { error } = await supabase
          .from("smart_goals")
          .update({ subject, description })
          .eq("id", editId);

        if (error) throw error;
      } else {
        // 추가
        const { error } = await supabase
          .from("smart_goals")
          .insert({ user_id: user.id, subject, description });

        if (error) throw error;
      }

      setOpen(false);
      setSubject("");
      setDescription("");
      setEditId(null);
      fetchGoals();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "목표 저장 중 오류가 발생했습니다.");
    } finally {
      setAddLoading(false);
    }
  };

  // 목표 수정 모달 열기
  const handleEdit = (goal: SmartGoal) => {
    setEditId(goal.id);
    setSubject(goal.subject);
    setDescription(goal.description);
    setOpen(true);
  };

  // 세션 입력 폼 열기
  const openSessionEdit = (goalId: string, sessionNo: number) => {
    const session = sessions[goalId]?.find(s => s.session_no === sessionNo);
    setSessionForm({
      percent: session ? session.percent.toString() : "",
      reflection: session ? session.reflection : ""
    });
    setSessionEdit({ goalId, sessionNo });
  };

  // 세션 입력 폼 닫기
  const closeSessionEdit = () => {
    setSessionEdit(null);
    setSessionForm({ percent: "", reflection: "" });
  };

  // 세션 저장
  const handleSessionSave = async (goalId: string, sessionNo: number) => {
    try {
      setSessionSaveLoading(true);

      const percent = parseInt(sessionForm.percent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        throw new Error("달성도는 0-100 사이의 숫자여야 합니다.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const existingSession = sessions[goalId]?.find(s => s.session_no === sessionNo);

      if (existingSession) {
        // 세션 수정
        const { error } = await supabase
          .from("goal_sessions")
          .update({
            percent,
            reflection: sessionForm.reflection
          })
          .eq("id", existingSession.id);

        if (error) throw error;
      } else {
        // 세션 추가
        const { error } = await supabase
          .from("goal_sessions")
          .insert({
            goal_id: goalId,
            session_no: sessionNo,
            percent,
            reflection: sessionForm.reflection
          });

        if (error) throw error;
      }

      closeSessionEdit();
      fetchSessions(goalId);
    } catch (e: any) {
      console.error(e);
      setSessionError(prev => ({ ...prev, [goalId]: e.message || "세션 저장 중 오류가 발생했습니다." }));
    } finally {
      setSessionSaveLoading(false);
    }
  };

  // 세션 삭제
  const handleSessionDelete = async (goalId: string, sessionNo: number) => {
    if (!window.confirm("세션 기록을 삭제하시겠습니까?")) return;

    try {
      const session = sessions[goalId]?.find(s => s.session_no === sessionNo);
      if (!session) return;

      const { error } = await supabase
        .from("goal_sessions")
        .delete()
        .eq("id", session.id);

      if (error) throw error;

      fetchSessions(goalId);
    } catch (e: any) {
      console.error(e);
      setSessionError(prev => ({ ...prev, [goalId]: e.message || "세션 삭제 중 오류가 발생했습니다." }));
    }
  };

  // 목표 삭제
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleteLoading(true);

      // 먼저 관련 세션 삭제
      const { error: sessionError } = await supabase
        .from("goal_sessions")
        .delete()
        .eq("goal_id", deleteId);

      if (sessionError) throw sessionError;

      // 그 다음 목표 삭제
      const { error } = await supabase
        .from("smart_goals")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setDeleteId(null);
      fetchGoals();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "목표 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>학생 대시보드</Typography>
        <LogoutButton />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 0 }}>나의 SMART 목표</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditId(null);
            setSubject("");
            setDescription("");
            setOpen(true);
          }}
          disabled={goals.length >= 3}
          sx={{ fontWeight: "bold" }}
        >
          목표 추가 ({goals.length}/3)
        </Button>
      </Box>

      {/* 오늘 세션 입력이 없으면 안내 알림 */}
      {(() => {
        const today = new Date().toISOString().slice(0, 10);
        const hasTodaySession = Object.values(sessions).flat().some(s => s.created_at.slice(0, 10) === today);
        if (!hasTodaySession) {
          return (
            <Alert severity="info" sx={{ mb: 2 }}>
              오늘 학습 세션 기록이 없습니다. 목표 달성을 위해 오늘의 학습을 기록해보세요!
            </Alert>
          );
        }
        return null;
      })()}

      {/* 목표별 최근 7일 평균 달성률이 60% 미만인 경우 경고 카드 */}
      {(() => {
        // 최근 7일 이내 세션 필터링 & 목표별 그룹화
        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().slice(0, 10);
        });
        
        const lowPerformingGoals = goals.filter(goal => {
          const goalSessions = sessions[goal.id] || [];
          const recentSessions = goalSessions.filter(s => 
            last7Days.includes(s.created_at.slice(0, 10))
          );
          
          if (recentSessions.length === 0) return false; // 최근 세션 없으면 제외
          
          const avgPercent = recentSessions.reduce((sum, s) => sum + s.percent, 0) / recentSessions.length;
          return avgPercent < 60; // 60% 미만 목표만 선택
        });
        
        if (lowPerformingGoals.length > 0) {
          return (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>최근 7일간 달성률이 저조한 목표가 있습니다:</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {lowPerformingGoals.map(goal => (
                  <Box component="li" key={goal.id}>
                    [{goal.subject}] {goal.description}
                  </Box>
                ))}
              </Box>
            </Alert>
          );
        }
        return null;
      })()}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : goals.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 4, p: 3, bgcolor: "#f5f5f5", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>등록된 학습 목표가 없습니다.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            상단의 '목표 추가' 버튼을 클릭하여 새로운 SMART 목표를 설정해보세요.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditId(null);
              setSubject("");
              setDescription("");
              setOpen(true);
            }}
          >
            목표 추가하기
          </Button>
        </Box>
      ) : (
        <List sx={{ width: "100%" }}>
          {goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              sessions={sessions}
              sessionLoading={sessionLoading}
              sessionError={sessionError}
              sessionEdit={sessionEdit}
              sessionForm={sessionForm}
              sessionSaveLoading={sessionSaveLoading}
              setEditId={handleEdit}
              setDeleteId={setDeleteId}
              setOpenReflectionGoalId={setOpenReflectionGoalId}
              setOpenProgressGoalId={setOpenProgressGoalId}
              setSessionForm={setSessionForm}
              openSessionEdit={openSessionEdit}
              closeSessionEdit={closeSessionEdit}
              handleSessionSave={handleSessionSave}
              handleSessionDelete={handleSessionDelete}
            />
          ))}
        </List>
      )}

      {/* 반성문 전체 보기 모달 */}
      <Dialog open={Boolean(openReflectionGoalId)} onClose={() => setOpenReflectionGoalId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>반성문 전체 보기</DialogTitle>
        <DialogContent>
          {openReflectionGoalId && (
            <List>
              {(sessions[openReflectionGoalId] || []).length === 0 && (
                <ListItem>
                  <ListItemText primary="반성문 기록이 없습니다." />
                </ListItem>
              )}
              {(sessions[openReflectionGoalId] || []).map((s, idx) => (
                <ListItem key={s.id || idx} alignItems="flex-start">
                  <ListItemText
                    primary={
                      <>
                        <b>{s.created_at.slice(0, 10)}</b> / 달성률: <b>{s.percent}%</b>
                      </>
                    }
                    secondary={s.reflection || <span style={{color:'#aaa'}}>반성문 없음</span>}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReflectionGoalId(null)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 달성률 변화 모달 */}
      <Dialog open={Boolean(openProgressGoalId)} onClose={() => setOpenProgressGoalId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>달성률 변화</DialogTitle>
        <DialogContent>
          {openProgressGoalId && (sessions[openProgressGoalId] || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sessions[openProgressGoalId]?.map((s, idx) => ({
                idx: idx + 1,
                date: s.created_at.slice(0, 10),
                percent: s.percent
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="percent" stroke="#1976d2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Typography>차트를 표시할 데이터가 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProgressGoalId(null)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 목표 추가/수정 모달 */}
      <Dialog open={open} onClose={() => !addLoading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "학습 목표 수정" : "학습 목표 추가"}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent>
            <TextField
              label="과목"
              value={subject}
              onChange={e => setSubject(e.target.value)}
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
              label="SMART 목표 설명"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              margin="normal"
              required
              multiline
              rows={4}
              placeholder="구체적이고 측정 가능한 학습 목표를 설정하세요."
              helperText="SMART(구체적이고, 측정가능하며, 달성가능하고, 관련성있으며, 시간제한이 있는) 목표를 설정하세요."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={addLoading}>취소</Button>
            <Button type="submit" variant="contained" color="primary" disabled={addLoading}>
              {addLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 목표 삭제 확인 모달 */}
      <Dialog open={Boolean(deleteId)} onClose={() => !deleteLoading && setDeleteId(null)} maxWidth="xs">
        <DialogTitle>목표 삭제</DialogTitle>
        <DialogContent>
          <Typography>이 목표와 관련된 모든 세션 기록이 삭제됩니다. 계속하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleteLoading}>취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 요일별 학습 빈도 바차트 */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" gutterBottom>최근 4주간 요일별 학습 빈도</Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart 
            data={(() => {
              // 4주간 모든 세션 펼치기
              const allSessions: any[] = Object.values(sessions || {}).flat();
              const last28 = Array.from({length: 28}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().slice(0, 10);
              });
              const weekMap = ["일", "월", "화", "수", "목", "금", "토"];
              const freq: Record<string, number> = {
                "일": 0, "월": 0, "화": 0, "수": 0, "목": 0, "금": 0, "토": 0
              };
              
              allSessions.forEach((s: any) => {
                if (s && s.created_at) {
                  const d = new Date(s.created_at);
                  const dateStr = d.toISOString().slice(0, 10);
                  if (last28.includes(dateStr)) {
                    const day = weekMap[d.getDay()];
                    if (day in freq) {
                      freq[day]++;
                    }
                  }
                }
              });
              
              return weekMap.map(day => ({ day, count: freq[day] || 0 }));
            })()}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#1976d2" name="학습 횟수" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
