"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Box, Typography, Button, List, ListItem, ListItemText, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton,
  Accordion, AccordionSummary, AccordionDetails, Grid, Card, CardContent, LinearProgress, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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

import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

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
  const [sessions, setSessions] = useState<Record<string, GoalSession[]>>({}); // goal_id -> GoalSession[]
  const [sessionLoading, setSessionLoading] = useState<Record<string, boolean>>({});
  const [sessionError, setSessionError] = useState<Record<string, string>>({});
  const [sessionEdit, setSessionEdit] = useState<{goalId: string, sessionNo: number} | null>(null);
  const [sessionForm, setSessionForm] = useState<{percent: string, reflection: string}>({percent: "", reflection: ""});
  const [sessionSaveLoading, setSessionSaveLoading] = useState(false);

  // 날짜별 학습 기록 및 그래프 상태
  const [dateRecords, setDateRecords] = useState<{date: string, count: number, avgPercent: number}[]>([]);
  // 목표별 최근 7일 평균 달성률
  const [goalAverages, setGoalAverages] = useState<Record<string, number>>({});
  // 목표별 누적 달성률
  const [goalTotalAverages, setGoalTotalAverages] = useState<Record<string, number>>({});
  // 반성문 전체 보기 모달 상태
  const [openReflectionGoalId, setOpenReflectionGoalId] = useState<string | null>(null);
  // 달성률 변화 모달 상태
  const [openProgressGoalId, setOpenProgressGoalId] = useState<string | null>(null);
  // AI 피드백 상태 (목표별 관리 - map 내부에서 useState 호출 방지)
  const [aiFeedbacks, setAiFeedbacks] = useState<Record<string, {
    feedback: string | null;
    loading: boolean;
    error: string | null;
  }>>({});
  // 역할 상태
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  // 인증 및 권한 체크
  useEffect(() => {
    getUserRole().then((r) => {
      setRole(r);
      if (r !== "STUDENT") router.replace("/login");
    });
  }, [router]);

  // 날짜별 집계 및 그래프 데이터 가공
  useEffect(() => {
    // 모든 세션 데이터 펼치기
    const allSessions: GoalSession[] = Object.values(sessions).flat();
    if (allSessions.length === 0) {
      setDateRecords([]);
      setGoalAverages({});
      setGoalTotalAverages({});
      return;
    }
    // 날짜별 집계
    const map: Record<string, {count: number, sum: number}> = {};
    allSessions.forEach(s => {
      const date = s.created_at.slice(0, 10); // YYYY-MM-DD
      if (!map[date]) map[date] = { count: 0, sum: 0 };
      map[date].count++;
      map[date].sum += s.percent;
    });
    // 최근 7일만
    const days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const records = days.map(date => {
      const entry = map[date];
      return {
        date,
        count: entry ? entry.count : 0,
        avgPercent: entry ? Math.round(entry.sum / entry.count) : 0,
      };
    });
    setDateRecords(records);

    // 목표별 최근 7일 평균 달성률
    const goalAverages: Record<string, number> = {};
    const goalTotalAverages: Record<string, number> = {};
    Object.entries(sessions).forEach(([goalId, arr]) => {
      // 최근 7일 평균
      const last7 = arr.filter(s => days.includes(s.created_at.slice(0, 10)));
      goalAverages[goalId] = last7.length > 0 ? Math.round(last7.reduce((a, b) => a + b.percent, 0) / last7.length) : 0;
      // 전체 누적 평균
      goalTotalAverages[goalId] = arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b.percent, 0) / arr.length) : 0;
    });
    setGoalAverages(goalAverages);
    setGoalTotalAverages(goalTotalAverages);
  }, [sessions]);

  // ... 이하 기존 코드 유지
  // (중복 선언 제거됨)

  const fetchGoals = async () => {
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("smart_goals")
      .select("id, subject, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setGoals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SMART 목표별 세션 fetch
  useEffect(() => {
    if (goals.length === 0) return;
    goals.forEach(goal => fetchSessions(goal.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals.length]);

  const fetchSessions = async (goalId: string) => {
    setSessionLoading(prev => ({ ...prev, [goalId]: true }));
    setSessionError(prev => ({ ...prev, [goalId]: "" }));
    const { data, error } = await supabase
      .from("goal_sessions")
      .select("id, goal_id, session_no, percent, reflection, created_at")
      .eq("goal_id", goalId)
      .order("session_no", { ascending: true });
    if (error) setSessionError(prev => ({ ...prev, [goalId]: error.message }));
    else setSessions(prev => ({ ...prev, [goalId]: data || [] }));
    setSessionLoading(prev => ({ ...prev, [goalId]: false }));
  };

  // 세션 추가/수정 핸들러
  const handleSessionSave = async (goalId: string, sessionNo: number) => {
    setSessionSaveLoading(true);
    const existing = sessions[goalId]?.find(s => s.session_no === sessionNo);
    let error = null;
    if (existing) {
      // 수정
      const { error: err } = await supabase.from("goal_sessions").update({
        percent: Number(sessionForm.percent),
        reflection: sessionForm.reflection
      }).eq("id", existing.id);
      error = err;
    } else {
      // 추가
      const { error: err } = await supabase.from("goal_sessions").insert({
        goal_id: goalId,
        session_no: sessionNo,
        percent: Number(sessionForm.percent),
        reflection: sessionForm.reflection
      });
      error = err;
    }
    if (!error) {
      setSessionEdit(null);
      setSessionForm({percent: "", reflection: ""});
      fetchSessions(goalId);
    }
    setSessionSaveLoading(false);
  };

  // 세션 삭제 핸들러
  const handleSessionDelete = async (goalId: string, sessionNo: number) => {
    setSessionSaveLoading(true);
    const target = sessions[goalId]?.find(s => s.session_no === sessionNo);
    if (!target) return;
    const { error } = await supabase.from("goal_sessions").delete().eq("id", target.id);
    if (!error) fetchSessions(goalId);
    setSessionSaveLoading(false);
  };

  // 세션 입력 폼 열기
  const openSessionEdit = (goalId: string, sessionNo: number) => {
    const existing = sessions[goalId]?.find(s => s.session_no === sessionNo);
    setSessionEdit({goalId, sessionNo});
    setSessionForm({
      percent: existing ? String(existing.percent) : "",
      reflection: existing ? existing.reflection : ""
    });
  };

  // 세션 입력 폼 닫기
  const closeSessionEdit = () => {
    setSessionEdit(null);
    setSessionForm({percent: "", reflection: ""});
  };


  const handleAddGoal = async () => {
    setAddLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      setAddLoading(false);
      return;
    }
    if (editId) {
      // 수정
      const { error } = await supabase.from("smart_goals").update({
        subject,
        description,
      }).eq("id", editId);
      if (error) setError(error.message);
      else {
        setOpen(false);
        setSubject("");
        setDescription("");
        setEditId(null);
        fetchGoals();
      }
    } else {
      // 추가
      const { error } = await supabase.from("smart_goals").insert({
        user_id: user.id,
        subject,
        description,
      });
      if (error) setError(error.message);
      else {
        setOpen(false);
        setSubject("");
        setDescription("");
        fetchGoals();
      }
    }
    setAddLoading(false);
  };

  const handleEdit = (goal: SmartGoal) => {
    setEditId(goal.id);
    setSubject(goal.subject);
    setDescription(goal.description);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError("");
    const { error } = await supabase.from("smart_goals").delete().eq("id", deleteId);
    if (error) setError(error.message);
    else {
      setDeleteId(null);
      fetchGoals();
    }
    setDeleteLoading(false);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>학생 대시보드</Typography>
      <Typography variant="h6" gutterBottom>나의 SMART 목표</Typography>

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
      {goals.length > 0 && (
        <Box mb={2}>
          {goals
            .filter(g => goalAverages[g.id] !== undefined && goalAverages[g.id] < 60)
            .map(g => (
              <Alert severity="warning" key={g.id} sx={{ mb: 1 }}>
                목표 <b>{g.subject}</b>의 최근 7일 평균 달성률이 낮습니다: <b>{goalAverages[g.id]}%</b>
              </Alert>
            ))}
        </Box>
      )}

      {/* AI 피드백: 목표별 실제 Claude 피드백 요청 및 결과 표시 */}
      {goals.length > 0 && (
        <Box mb={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>AI 피드백</Typography>
              {goals.map(g => {
                // 최근 7일 세션/반성
                const last7 = Array.from({length: 7}, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  return date.toISOString().slice(0, 10);
                });
                const recentSessions = (sessions[g.id] || []).filter(s => last7.includes(s.created_at.slice(0, 10)));
                const reflections = recentSessions.map(s => s.reflection).filter(r => !!r);
                const avg = goalAverages[g.id] ?? 0;
                
                // Hook 사용하지 않고 상태 참조
                const feedback = aiFeedbacks[g.id] || { feedback: null, loading: false, error: null };
                
                const handleRequest = async () => {
                  // 상태 변경을 객체로 관리
                  setAiFeedbacks(prev => ({
                    ...prev,
                    [g.id]: { ...prev[g.id], loading: true, error: null, feedback: null }
                  }));
                  
                  try {
                    const res = await fetch("/api/ai-feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ subject: g.subject, avgPercent: avg, reflections })
                    });
                    if (!res.ok) throw new Error(await res.text());
                    const data = await res.json();
                    
                    setAiFeedbacks(prev => ({
                      ...prev,
                      [g.id]: { ...prev[g.id], feedback: data.feedback, loading: false }
                    }));
                  } catch (e: any) {
                    setAiFeedbacks(prev => ({
                      ...prev,
                      [g.id]: { ...prev[g.id], error: e.message || "AI 피드백 요청 실패", loading: false }
                    }));
                  }
                };
                
                return (
                  <Box key={g.id} mb={2}>
                    <Typography variant="body2" gutterBottom>
                      <b>{g.subject}</b> 최근 7일 평균 <b>{avg}%</b>
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <button onClick={handleRequest} disabled={feedback.loading} style={{padding: '4px 12px', borderRadius: 4, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', cursor: feedback.loading ? 'not-allowed' : 'pointer'}}>
                        {feedback.loading ? '피드백 생성중...' : 'AI 피드백 요청'}
                      </button>
                      {feedback.feedback && <span style={{color:'#1976d2'}}>{feedback.feedback}</span>}
                      {feedback.error && <span style={{color:'red'}}>{feedback.error}</span>}
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 날짜별 학습 기록 및 그래프 */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>최근 7일간 학습 현황</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dateRecords} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Line type="monotone" dataKey="avgPercent" stroke="#1976d2" name="평균 달성률(%)" />
          </LineChart>
        </ResponsiveContainer>
        <Box mt={2}>
          <Typography variant="subtitle2">일별 학습 기록</Typography>
          <List dense>
            {dateRecords.map(r => (
              <ListItem key={r.date}>
                <ListItemText
                  primary={`${r.date} - ${r.count > 0 ? `${r.count}건, 평균 달성률 ${r.avgPercent}%` : '기록 없음'}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        sx={{ mb: 2 }}
        onClick={() => {
          setOpen(true);
          setEditId(null);
          setSubject("");
          setDescription("");
        }}
      >
        목표 추가
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editId ? "SMART 목표 수정" : "SMART 목표 추가"}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="과목"
            value={subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
            fullWidth
            margin="normal"
            required
          >
            {SUBJECTS.map(subj => (
              <MenuItem key={subj} value={subj}>{subj}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="목표 내용"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            required
          />
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={addLoading}>취소</Button>
          <Button onClick={handleAddGoal} variant="contained" disabled={addLoading || !subject || !description}>
            {addLoading ? (editId ? "수정 중..." : "저장 중...") : (editId ? "수정" : "저장")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>목표 삭제</DialogTitle>
        <DialogContent>
          <Typography>정말로 이 목표를 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleteLoading}>취소</Button>
          <Button color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <List>
          {goals.length === 0 && <ListItem><ListItemText primary="등록된 목표가 없습니다." /></ListItem>}
          {goals.map(goal => (
            <Accordion key={goal.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box flex={1} display="flex" alignItems="center">
                  <Box flex={1}>
                    <Typography variant="subtitle1">{goal.subject}</Typography>
                    <Typography variant="body2" color="text.secondary">{goal.description}</Typography>
                    {/* 목표별 누적 달성률 ProgressBar 및 최근 7일 평균 */}
                    <Box mt={1} mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        누적 평균 달성률: <b>{goalTotalAverages[goal.id] ?? 0}%</b> / 최근 7일 평균: <b>{goalAverages[goal.id] ?? 0}%</b>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={goalTotalAverages[goal.id] ?? 0}
                        sx={{ height: 8, borderRadius: 4, mt: 0.5, backgroundColor: '#eee' }}
                      />
                    </Box>
                    {/* 최근 세션 반성 요약 & 통계 버튼 */}
                    {(() => {
                      const arr = sessions[goal.id] || [];
                      if (arr.length === 0) return null;
                      const latest = arr[arr.length - 1];
                      return (
                        <>
                          <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                            최근 반성: "{latest.reflection ? latest.reflection.slice(0, 40) : '작성된 반성 없음'}{latest.reflection && latest.reflection.length > 40 ? '...' : ''}"
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button size="small" onClick={e => { e.stopPropagation(); setOpenReflectionGoalId(goal.id); }}>
                              반성문 전체 보기
                            </Button>
                            <Button size="small" color="secondary" onClick={e => { e.stopPropagation(); setOpenProgressGoalId(goal.id); }}>
                              달성률 변화
                            </Button>
                          </Box>
                        </>
                      );
                    })()}

                  </Box>
                  <IconButton edge="end" aria-label="edit" onClick={e => {e.stopPropagation(); handleEdit(goal);}}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={e => {e.stopPropagation(); setDeleteId(goal.id);}}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography fontWeight={600} mb={1}>세션별 달성도 및 반성</Typography>
                {sessionLoading[goal.id] ? <CircularProgress size={24} /> : (
                  <>
                    {[1,2,3].map(sessionNo => {
                      const session = sessions[goal.id]?.find(s => s.session_no === sessionNo);
                      const isEditing = sessionEdit && sessionEdit.goalId === goal.id && sessionEdit.sessionNo === sessionNo;
                      return (
                        <Box key={sessionNo} mb={2} p={1} border={1} borderRadius={2} borderColor="grey.200">
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={12} sm={2}>
                              <Typography fontWeight={500}>세션 {sessionNo}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={10}>
                              {isEditing ? (
                                <Box component="form" onSubmit={e => {e.preventDefault(); handleSessionSave(goal.id, sessionNo);}}>
                                  <TextField
                                    label="달성도(%)"
                                    type="number"
                                    value={sessionForm.percent}
                                    onChange={e => setSessionForm(f => ({...f, percent: e.target.value}))}
                                    inputProps={{ min: 0, max: 100 }}
                                    size="small"
                                    sx={{ mr: 1, width: 100 }}
                                    required
                                  />
                                  <TextField
                                    label="학습 반성"
                                    value={sessionForm.reflection}
                                    onChange={e => setSessionForm(f => ({...f, reflection: e.target.value}))}
                                    size="small"
                                    sx={{ mr: 1, width: 250 }}
                                    required
                                  />
                                  <Button type="submit" variant="contained" size="small" disabled={sessionSaveLoading} sx={{ mr: 1 }}>
                                    {sessionSaveLoading ? "저장 중..." : "저장"}
                                  </Button>
                                  <Button onClick={closeSessionEdit} size="small" disabled={sessionSaveLoading}>취소</Button>
                                </Box>
                              ) : (
                                <Box display="flex" alignItems="center">
                                  <Typography sx={{ mr: 2 }}>
                                    {session ? `달성도: ${session.percent}% | 반성: ${session.reflection}` : "기록 없음"}
                                  </Typography>
                                  <Button size="small" onClick={() => openSessionEdit(goal.id, sessionNo)} sx={{ mr: 1 }}>
                                    {session ? "수정" : "입력"}
                                  </Button>
                                  {session && (
                                    <Button size="small" color="error" onClick={() => handleSessionDelete(goal.id, sessionNo)}>
                                      삭제
                                    </Button>
                                  )}
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })}
                  </>
                )}
                {sessionError[goal.id] && <Typography color="error">{sessionError[goal.id]}</Typography>}
              </AccordionDetails>
            </Accordion>
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
              <Line type="monotone" dataKey="percent" stroke="#1976d2" name="달성률(%)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Typography color="text.secondary">달성률 기록이 없습니다.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenProgressGoalId(null)}>닫기</Button>
      </DialogActions>
    </Dialog>
    {/* 요일별 학습 빈도 바차트 */}
    <Box mt={6}>
      <Typography variant="h6" gutterBottom>최근 4주간 요일별 학습 빈도</Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={(() => {
          // 4주간 모든 세션 펼치기
          const allSessions: GoalSession[] = Object.values(sessions).flat();
          const last28 = Array.from({length: 28}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().slice(0, 10);
          });
          const weekMap = ["일", "월", "화", "수", "목", "금", "토"];
          const freq: Record<string, number> = {"일":0, "월":0, "화":0, "수":0, "목":0, "금":0, "토":0};
          allSessions.forEach(s => {
            const d = new Date(s.created_at);
            const dateStr = d.toISOString().slice(0, 10);
            if (last28.includes(dateStr)) {
              const day = weekMap[d.getDay()];
              freq[day]++;
            }
          });
          return weekMap.map(day => ({ day, count: freq[day] }));
        })()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

