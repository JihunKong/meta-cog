"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
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
  const [editingSession, setEditingSession] = useState<{goalId: string, sessionNo: number} | null>(null);
  const [sessionForm, setSessionForm] = useState({ percent: "", reflection: "" });
  const [openReflectionGoalId, setOpenReflectionGoalId] = useState<string | null>(null);
  const [openProgressGoalId, setOpenProgressGoalId] = useState<string | null>(null);
  
  // 그래프 상태
  const [dateRecords, setDateRecords] = useState<any[]>([]);
  const [goalAverages, setGoalAverages] = useState<Record<string, number>>({});
  const [goalTotalAverages, setGoalTotalAverages] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, {loading: boolean, feedback: string, error: string}>>({});

  const router = useRouter();

  // 초기 로드 - 목표 및 세션 가져오기
  useEffect(() => {
    async function checkAuth() {
      const role = await getUserRole();
      console.log('Student dashboard - User role:', role); // 디버깅용 로그
      if (role !== "STUDENT") { // 대문자로 변경 (auth.ts에서는 "STUDENT"로 반환함)
        console.log('Redirecting from student dashboard - wrong role:', role);
        window.location.href = "/"; // Next.js router 대신 직접 리디렉션
        return;
      }
      fetchGoals();
    }
    checkAuth();
  }, [router]);

  // 목표 가져오기
  const fetchGoals = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("smart_goals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setGoals(data || []);
      
      // 목표마다 세션 가져오기
      if (data && data.length > 0) {
        for (const goal of data) {
          fetchSessions(goal.id);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 목표 수정 처리
  const handleEdit = (goal: SmartGoal) => {
    setEditId(goal.id);
    setSubject(goal.subject);
    setDescription(goal.description);
    setOpen(true);
  };

  // 목표 저장 (추가/수정) 처리
  const handleSave = async () => {
    if (!subject || !description) return;
    setAddLoading(true);
    setError("");

    try {
      if (editId) {
        // 목표 수정
        const { error } = await supabase
          .from("smart_goals")
          .update({ subject, description })
          .eq("id", editId);
        
        if (error) throw error;
      } else {
        // 목표 추가
        const { error } = await supabase
          .from("smart_goals")
          .insert([
            {
              subject,
              description
            }
          ]);
        
        if (error) throw error;
      }
      
      // 저장 성공 후 목표 목록 다시 가져오기
      fetchGoals();
      // 모달 닫기 및 폼 초기화
      setOpen(false);
      setSubject("");
      setDescription("");
      setEditId(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  // 목표 삭제 처리
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError("");
    
    try {
      // 목표 삭제
      const { error } = await supabase
        .from("smart_goals")
        .delete()
        .eq("id", deleteId);
      
      if (error) throw error;
      
      // 삭제 성공 후 목표 목록 다시 가져오기
      fetchGoals();
      // 모달 닫기
      setDeleteId(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 세션 가져오기
  const fetchSessions = async (goalId: string) => {
    setSessionLoading(prev => ({ ...prev, [goalId]: true }));
    setSessionError(prev => ({ ...prev, [goalId]: "" }));
    
    try {
      const { data, error } = await supabase
        .from("goal_sessions")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setSessions(prev => ({ ...prev, [goalId]: data || [] }));
      
      // 전체 데이터에서 최근 7일간 평균 및 전체 평균 계산
      if (data && data.length > 0) {
        // 최근 7일 필터링
        const now = new Date();
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        const recentSessions = data.filter(s => new Date(s.created_at) >= sevenDaysAgo);
        
        // 평균 계산
        const recentAvg = recentSessions.length > 0 
          ? recentSessions.reduce((acc, s) => acc + (s.percent || 0), 0) / recentSessions.length
          : 0;
        
        const totalAvg = data.reduce((acc, s) => acc + (s.percent || 0), 0) / data.length;
        
        setGoalAverages(prev => ({ ...prev, [goalId]: Math.round(recentAvg) }));
        setGoalTotalAverages(prev => ({ ...prev, [goalId]: Math.round(totalAvg) }));
      }
    } catch (e: any) {
      setSessionError(prev => ({ ...prev, [goalId]: e.message }));
    } finally {
      setSessionLoading(prev => ({ ...prev, [goalId]: false }));
    }
  };
  
  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>학생 대시보드</Typography>
        <LogoutButton />
      </Box>
      <Typography variant="h6" gutterBottom>나의 SMART 목표</Typography>
      
      {/* 일별 학습 현황 요약 그래프 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>최근 7일간 학습 현황</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart 
            data={dateRecords} 
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Line type="monotone" dataKey="avgPercent" stroke="#1976d2" name="평균 달성률(%)" />
          </LineChart>
        </ResponsiveContainer>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">일별 학습 기록</Typography>
          <List dense>
            {dateRecords.map((r, idx) => (
              <ListItem key={idx}>
                <ListItemText 
                  primary={r.date} 
                  secondary={`학습 세션 ${r.count}개 | 평균 달성률 ${r.avgPercent}%`} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
      
      {/* 주간 학습 현황 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>주간 학습 횟수</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={(() => {
              const weekMap = ['월', '화', '수', '목', '금', '토', '일'];
              const freq: {[key: string]: number} = {};
              weekMap.forEach(day => freq[day] = 0);
              
              Object.values(sessions).forEach(goalSessions => {
                for (const s of goalSessions) {
                  if (s.created_at) {
                    const day = weekMap[new Date(s.created_at).getDay()];
                    freq[day]++;
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

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : goals.length === 0 ? (
        <Alert severity="info">
          등록된 SMART 목표가 없습니다. 새로운 목표를 설정해 보세요!
        </Alert>
      ) : (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditId(null);
                setSubject("");
                setDescription("");
                setOpen(true);
              }}
            >
              목표 추가
            </Button>
          </Box>
          
          {goals.map(goal => (
            <Accordion key={goal.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <Typography variant="h6">{goal.subject}</Typography>
                  <Box sx={{ display: "flex" }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenProgressGoalId(goal.id);
                      }}
                      sx={{ mr: 1 }}
                    >
                      달성도 변화
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenReflectionGoalId(goal.id);
                      }}
                      sx={{ mr: 2 }}
                    >
                      세션 모아보기
                    </Button>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(goal);
                      }}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(goal.id);
                      }}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{goal.description}</Typography>
                
                {/* 목표별 최근 7일 평균 달성도 표시 */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2">최근 7일 평균 달성도: <b>{goalAverages[goal.id] || 0}%</b></Typography>
                    <Typography variant="body2">누적 평균: <b>{goalTotalAverages[goal.id] || 0}%</b></Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={goalAverages[goal.id] || 0} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                
                <Typography sx={{ fontWeight: 600, mb: 1 }}>세션별 달성도 및 반성</Typography>
                {sessionLoading[goal.id] ? <CircularProgress size={24} /> : (
                  <>
                    {[1, 2, 3].map(sessionNo => {
                      const session = (sessions[goal.id] || []).find(s => s.session_no === sessionNo);
                      const isEditing = editingSession && 
                        editingSession.goalId === goal.id && 
                        editingSession.sessionNo === sessionNo;
                      
                      const openSessionEdit = (goalId: string, sessionNo: number) => {
                        setEditingSession({ goalId, sessionNo });
                        if (session) {
                          setSessionForm({
                            percent: session.percent.toString(),
                            reflection: session.reflection,
                          });
                        } else {
                          setSessionForm({ percent: "", reflection: "" });
                        }
                      };
                      
                      const handleSessionSave = async (goalId: string, sessionNo: number) => {
                        if (!sessionForm.percent) return;
                        
                        try {
                          const percent = parseInt(sessionForm.percent);
                          if (percent < 0 || percent > 100) {
                            alert("달성도는 0에서 100 사이의 값이어야 합니다.");
                            return;
                          }
                          
                          if (session) {
                            // 세션 업데이트
                            await supabase
                              .from("goal_sessions")
                              .update({
                                percent,
                                reflection: sessionForm.reflection
                              })
                              .eq("id", session.id);
                          } else {
                            // 세션 생성
                            await supabase
                              .from("goal_sessions")
                              .insert([
                                {
                                  goal_id: goalId,
                                  session_no: sessionNo,
                                  percent,
                                  reflection: sessionForm.reflection
                                }
                              ]);
                          }
                          
                          // 세션 다시 가져오기
                          await fetchSessions(goalId);
                          // 폼 초기화
                          setEditingSession(null);
                          setSessionForm({ percent: "", reflection: "" });
                        } catch (e) {
                          console.error("Session save error:", e);
                          alert("세션 저장 중 오류가 발생했습니다.");
                        }
                      };
                      
                      const handleSessionDelete = async (goalId: string, sessionNo: number) => {
                        if (!session) return;
                        if (!confirm("정말로 이 세션을 삭제하시겠습니까?")) return;
                        
                        try {
                          await supabase
                            .from("goal_sessions")
                            .delete()
                            .eq("id", session.id);
                          
                          // 세션 다시 가져오기
                          await fetchSessions(goalId);
                        } catch (e) {
                          console.error("Session delete error:", e);
                          alert("세션 삭제 중 오류가 발생했습니다.");
                        }
                      };
                      
                      return (
                        <Box key={sessionNo} sx={{ mb: 2, border: "1px solid #e0e0e0", borderRadius: 1, p: 2 }}>
                          <Box sx={{
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            backgroundColor: "#f0f0f0",
                            p: 1,
                            mb: 1.5,
                            borderRadius: 1
                          }}>
                            <Typography sx={{ fontWeight: 600, color: "#555" }}>세션 {sessionNo}</Typography>
                            {!isEditing && (
                              <Box>
                                <Button 
                                  size="small" 
                                  variant="outlined"
                                  onClick={() => openSessionEdit(goal.id, sessionNo)}
                                  sx={{ minWidth: 0, px: 1.5 }}
                                >
                                  {session ? "수정" : "입력"}
                                </Button>
                                {session && (
                                  <Button 
                                    size="small" 
                                    color="error" 
                                    variant="outlined"
                                    onClick={() => handleSessionDelete(goal.id, sessionNo)}
                                    sx={{ ml: 1, minWidth: 0, px: 1.5 }}
                                  >
                                    삭제
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                            {isEditing ? (
                              <Box component="form" onSubmit={e => {e.preventDefault(); handleSessionSave(goal.id, sessionNo);}} sx={{ mt: 2 }}>
                                <TextField
                                  label="달성도(%)"
                                  type="number"
                                  value={sessionForm.percent}
                                  onChange={e => setSessionForm(f => ({...f, percent: e.target.value}))}
                                  inputProps={{ min: 0, max: 100 }}
                                  fullWidth
                                  margin="normal"
                                  required
                                />
                                <TextField
                                  label="반성"
                                  multiline
                                  rows={4}
                                  value={sessionForm.reflection}
                                  onChange={e => setSessionForm(f => ({...f, reflection: e.target.value}))}
                                  fullWidth
                                  margin="normal"
                                />
                                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                                  <Button 
                                    onClick={() => setEditingSession(null)} 
                                    sx={{ mr: 1 }}
                                  >
                                    취소
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    variant="contained" 
                                    disabled={!sessionForm.percent}
                                  >
                                    저장
                                  </Button>
                                </Box>
                              </Box>
                            ) : session ? (
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  달성도: <b>{session.percent}%</b>
                                </Typography>
                                {session.reflection && (
                                  <Typography variant="body2" color="text.secondary">
                                    <b>반성:</b> {session.reflection}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                  등록일: {new Date(session.created_at).toLocaleDateString()}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                해당 세션의 데이터가 없습니다. "입력" 버튼을 클릭하여 세션 정보를 입력해주세요.
                              </Typography>
                            )}
                        </Box>
                      );
                    })}
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
          
          {/* 목표 생성/수정 대화상자 */}
          <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>{editId ? "목표 수정" : "목표 추가"}</DialogTitle>
            <DialogContent>
              <TextField
                select
                fullWidth
                margin="normal"
                label="과목"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECTS.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                label="목표 설명"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)} disabled={addLoading}>취소</Button>
              <Button 
                onClick={handleSave} 
                disabled={!subject || !description || addLoading} 
                variant="contained"
              >
                {addLoading ? <CircularProgress size={24} /> : "저장"}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* 목표 삭제 확인 대화상자 */}
          <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
            <DialogTitle>목표 삭제</DialogTitle>
            <DialogContent>
              <Typography>정말로 이 목표를 삭제하시겠습니까? 목표에 속한 모든 세션 데이터도 함께 삭제됩니다.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteId(null)} disabled={deleteLoading}>취소</Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                variant="contained"
                color="error"
              >
                {deleteLoading ? <CircularProgress size={24} /> : "삭제"}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* 세션 모아보기 대화상자 */}
          <Dialog open={Boolean(openReflectionGoalId)} onClose={() => setOpenReflectionGoalId(null)} maxWidth="sm" fullWidth>
            <DialogTitle>세션 모아보기</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" gutterBottom>
                {goals.find(g => g.id === openReflectionGoalId)?.subject} - 세션 및 반성 모음
              </Typography>
              
              {openReflectionGoalId && (sessions[openReflectionGoalId] || []).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>아직 등록된 세션이 없습니다.</Alert>
              )}
              
              <List>
                {openReflectionGoalId && (sessions[openReflectionGoalId] || []).map((s: GoalSession, idx: number) => (
                  <ListItem key={s.id || idx} sx={{ alignItems: "flex-start" }}>
                    <ListItemText
                      primary={
                        <>
                          <span>세션 {s.session_no} ({new Date(s.created_at).toLocaleDateString()}) - </span>
                          <strong>{s.percent}% 달성</strong>
                        </>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          component="div" 
                          sx={{ mt: 1, p: 1, backgroundColor: "#f9f9f9", borderRadius: 1 }}
                        >
                          {s.reflection || "(반성 내용 없음)"}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenReflectionGoalId(null)}>닫기</Button>
            </DialogActions>
          </Dialog>
          
          {/* 달성도 변화 차트 대화상자 */}
          <Dialog open={Boolean(openProgressGoalId)} onClose={() => setOpenProgressGoalId(null)} maxWidth="sm" fullWidth>
            <DialogTitle>달성도 변화 차트</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" gutterBottom>
                {goals.find(g => g.id === openProgressGoalId)?.subject} - 세션별 달성도 추이
              </Typography>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={openProgressGoalId ? (sessions[openProgressGoalId] || []).sort((a: GoalSession, b: GoalSession) => 
                    a.created_at.localeCompare(b.created_at)) : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session_no" />
                    <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Line type="monotone" dataKey="percent" stroke="#1976d2" name="달성도(%)" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenProgressGoalId(null)}>닫기</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
}
