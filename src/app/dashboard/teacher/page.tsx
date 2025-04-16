"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";

interface Student {
  id: string;
  email: string;
  name: string;
  last_login: string;
}

import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  // [설명] 검색어를 저장하는 state입니다. 사용자가 입력창에 값을 입력하면 이 값이 바뀝니다.
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 학생별 목표/세션/반성문 데이터
  const [studentGoals, setStudentGoals] = useState<Record<string, any[]>>({});
  const [studentSessions, setStudentSessions] = useState<Record<string, any[]>>({});
  const [studentReflections, setStudentReflections] = useState<Record<string, any[]>>({});
  // 목표별 달성률 변화 차트 모달 상태
  const [openGoalChartId, setOpenGoalChartId] = useState<string | null>(null);
  // 교사 코멘트: { targetType, targetId, teacher, comment, created_at }
  const [comments, setComments] = useState<any[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({}); // key: targetType-targetId
  const teacherName = "이선생"; // 임시
  
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const r = await getUserRole();
        console.log('Teacher dashboard - User role:', r, typeof r); // 디버깅용 로그
        setRole(r);
        
        // 소문자 'teacher'로 비교 (반환값이 enum으로 소문자로 변경됨)
        if (r !== "teacher") {
          console.log('Redirecting from teacher dashboard - wrong role:', r);
          // router.replace 대신 직접 리디렉션 사용
          window.location.href = "/login";
          return;
        }
        
        // TEACHER 권한이 있으면 학생 데이터 가져오기
        fetchStudentData();
      } catch (err) {
        console.error('Auth check error:', err);
        window.location.href = "/login";
      }
    }
    checkAuth();
  }, [router]);

  // 전체 요약 통계
  const [summary, setSummary] = useState<{goalCount:number, sessionCount:number, reflectionCount:number, avgPercent:number} | null>(null);
  
  // 코멘트 등록 함수
  const handleAddComment = (targetType: string, targetId: string) => {
    const key = `${targetType}-${targetId}`;
    const text = commentInputs[key]?.trim();
    if (!text) return;
    setComments(prev => [
      ...prev,
      { targetType, targetId, teacher: teacherName, comment: text, created_at: new Date().toISOString() }
    ]);
    setCommentInputs(inputs => ({ ...inputs, [key]: "" }));
  };

  // 학생 데이터 가져오기
  async function fetchStudentData() {
    setLoading(true);
    setError(null);
    
    try {
      // Supabase에서 STUDENT 역할을 가진 사용자 가져오기
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .eq('role', 'STUDENT');

      if (profilesError) {
        throw new Error("학생 정보를 가져올 수 없습니다: " + profilesError.message);
      }
      
      // 사용자 데이터 포맷팅
      const formattedStudents = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || "이메일 없음",
        name: profile.email?.split('@')[0] || "이름 없음", // 이메일에서 임시 사용자명 생성
        last_login: new Date(profile.created_at).toLocaleDateString() || "-"
      }));
      
      setStudents(formattedStudents);
      
      // 학생 목표 가져오기
      await fetchStudentGoals(formattedStudents);
    } catch (err) {
      console.error('학생 데이터 로딩 오류:', err);
      setError("학생 데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }
  
  // 학생 목표 데이터 가져오기
  async function fetchStudentGoals(studentsList: Student[]) {
    try {
      const goalsData: Record<string, any[]> = {};
      
      // 각 학생별로 목표 가져오기
      for (const student of studentsList) {
        const { data: goals, error } = await supabase
          .from('smart_goals')
          .select('id, subject, description, created_at')
          .eq('user_id', student.id);
          
        if (error) {
          console.error(`학생 ${student.id} 목표 조회 오류:`, error);
          continue;
        }
        
        if (goals && goals.length > 0) {
          goalsData[student.id] = goals;
        }
      }
      
      setStudentGoals(goalsData);
      
      // 목표 정보가 있을 경우 세션 데이터도 가져오기
      await fetchSessionsAndReflections(goalsData);
    } catch (error) {
      console.error('학생 목표 데이터 조회 오류:', error);
    }
  }
  
  // 세션 및 반성문 데이터 가져오기
  async function fetchSessionsAndReflections(goalsData: Record<string, any[]>) {
    try {
      // 학생별 목표 정보가 있을 경우에만 세션 가져오기
      if (Object.keys(goalsData).length > 0) {
        const sessionsData: Record<string, any[]> = {};
        const reflectionsData: Record<string, any[]> = {};
        
        // 각 학생의 목표마다 세션 가져오기
        for (const studentId in goalsData) {
          // 반성문 데이터를 위한 배열 초기화
          reflectionsData[studentId] = [];
          
          const goals = goalsData[studentId] || [];
          for (const goal of goals) {
            const { data: sessions, error } = await supabase
              .from('goal_sessions')
              .select('id, goal_id, created_at, percent, reflection')
              .eq('goal_id', goal.id);
              
            if (error) {
              console.error(`목표 ${goal.id} 세션 조회 오류:`, error);
              continue;
            }
            
            if (sessions && sessions.length > 0) {
              sessionsData[goal.id] = sessions;
              
              // 반성문이 있는 세션만 반성문 데이터로 추가
              const validReflections = sessions
                .filter(s => s.reflection && s.reflection.trim() !== '')
                .map(session => ({
                  id: session.id,
                  goalId: goal.id,
                  date: new Date(session.created_at).toLocaleDateString(),
                  text: session.reflection
                }));
                
              if (validReflections.length > 0) {
                reflectionsData[studentId].push(...validReflections);
              }
            }
          }
          
          // 반성문이 없는 학생은 삭제
          if (reflectionsData[studentId].length === 0) {
            delete reflectionsData[studentId];
          }
        }
        
        setStudentSessions(sessionsData);
        setStudentReflections(reflectionsData);
        
        // 전체 요약 통계 계산
        const allSessions = Object.values(sessionsData).flat();
        const allReflections = Object.values(reflectionsData).flat();
        const goalCount = Object.values(goalsData).flat().length;
        
        let totalPercent = 0;
        allSessions.forEach(session => {
          totalPercent += (session.percent || 0);
        });
        
        setSummary({
          goalCount: goalCount,
          sessionCount: allSessions.length,
          reflectionCount: allReflections.length,
          avgPercent: allSessions.length ? Math.round(totalPercent / allSessions.length) : 0
        });
      } else {
        // 목표가 없는 경우 기본값 설정
        setSummary({
          goalCount: 0,
          sessionCount: 0,
          reflectionCount: 0,
          avgPercent: 0
        });
      }
    } catch (error) {
      console.error('세션 및 반성문 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // 초기 로드
  useEffect(() => {
    fetchStudentData();
  }, []);

  // 역할에 따른 조건부 렌더링
  return role !== "TEACHER" ? null : (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>교사 대시보드</Typography>
        <LogoutButton />
      </Box>
      {/* [설명] 학생 이름 또는 이메일로 검색할 수 있는 입력창입니다. */}
      <Box mb={2}>
        <input
          type="text"
          placeholder="학생 이름 또는 이메일 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, width: 280, border: '1px solid #ccc', borderRadius: 4 }}
        />
      </Box>
      <Typography variant="subtitle1" gutterBottom>전체 학생 목록 및 요약 통계</Typography>
      {/* 전체 학생 요약 통계 */}
      {summary && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">전체 학생 요약 통계</Typography>
            <Typography>목표 수: {summary.goalCount} / 세션 수: {summary.sessionCount} / 반성문 수: {summary.reflectionCount}</Typography>
            <Typography>평균 달성률: {summary.avgPercent}%</Typography>
          </CardContent>
        </Card>
      )}
      {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">학생 목록</Typography>
            <List>
              {/* [설명] 검색어가 비어 있으면 전체 학생, 검색어가 있으면 해당 학생만 보여줍니다. */}
              {students.filter(stu =>
                stu.name.includes(search) || stu.email.includes(search)
              ).map(stu => (
                <ListItem button key={stu.id} onClick={() => setSelected(stu)}>
                  <ListItemText primary={stu.name} secondary={`${stu.email} / 최근 접속: ${stu.last_login}`} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      {/* 학생 상세 모달 */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>학생 상세 정보</DialogTitle>
        <DialogContent>
          {selected && (
            <>
              <Typography variant="subtitle1">이름: {selected.name}</Typography>
              <Typography variant="subtitle2">이메일: {selected.email}</Typography>
              <Typography variant="body2" gutterBottom>최근 접속: {selected.last_login}</Typography>
              <Box mt={2}>
                <Typography variant="h6">SMART 목표</Typography>
                {(studentGoals[selected.id] ?? []).length === 0 ? (
                  <Typography color="text.secondary">등록된 목표가 없습니다.</Typography>
                ) : (
                  <List>
                    {(studentGoals[selected.id] ?? []).map(goal => (
                      <ListItem key={goal.id} alignItems="flex-start">
                        <ListItemText
                          primary={<b>{goal.subject}</b>}
                          secondary={<>
                            <Typography variant="body2">{goal.description}</Typography>
                            <Typography variant="caption">생성일: {goal.created_at}</Typography>
                            <Box mt={1}>
                              <Typography variant="subtitle2">세션/달성률/반성문</Typography>
                              {(studentSessions[goal.id] ?? []).length === 0 ? (
                                <Typography color="text.secondary">세션 기록 없음</Typography>
                              ) : (
                                <>
                                  <List dense>
                                    {(studentSessions[goal.id] ?? []).map(sess => (
                                      <ListItem key={sess.id} sx={{ pl: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <ListItemText
                                          primary={<>날짜: {sess.created_at} / 달성률: {sess.percent}%</>}
                                          secondary={sess.reflection ? `반성: ${sess.reflection}` : "반성문 없음"}
                                        />
                                        {/* 세션별 교사 코멘트 */}
                                        <Box sx={{ width: '100%', mt: 1, mb: 1 }}>
                                          <Typography variant="caption" color="secondary">교사 코멘트</Typography>
                                          <List dense sx={{ pl: 2 }}>
                                            {comments.filter(c => c.targetType === "session" && c.targetId === sess.id).map((c, idx) => (
                                              <ListItem key={idx} sx={{ pl: 0 }}>
                                                <ListItemText primary={c.comment} secondary={`by ${c.teacher} (${c.created_at.slice(0, 16).replace('T',' ')})`} />
                                              </ListItem>
                                            ))}
                                          </List>
                                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                            <input
                                              style={{ flex: 1, padding: 4, border: '1px solid #ddd', borderRadius: 4 }}
                                              placeholder="코멘트 입력..."
                                              value={commentInputs[`session-${sess.id}`] || ""}
                                              onChange={e => setCommentInputs(inputs => ({ ...inputs, [`session-${sess.id}`]: e.target.value }))}
                                              onKeyDown={e => { if (e.key === 'Enter') handleAddComment('session', sess.id); }}
                                            />
                                            <MuiButton size="small" onClick={() => handleAddComment('session', sess.id)}>등록</MuiButton>
                                          </Box>
                                        </Box>
                                      </ListItem>
                                    ))}
                                  </List>
                                  <MuiButton size="small" sx={{ mt: 1 }} onClick={() => setOpenGoalChartId(goal.id)}>
                                    달성률 변화 차트
                                  </MuiButton>
                                  {/* 목표별 교사 코멘트 */}
                                  <Box sx={{ width: '100%', mt: 2 }}>
                                    <Typography variant="caption" color="secondary">목표 코멘트</Typography>
                                    <List dense sx={{ pl: 2 }}>
                                      {comments.filter(c => c.targetType === "goal" && c.targetId === goal.id).map((c, idx) => (
                                        <ListItem key={idx} sx={{ pl: 0 }}>
                                          <ListItemText primary={c.comment} secondary={`by ${c.teacher} (${c.created_at.slice(0, 16).replace('T',' ')})`} />
                                        </ListItem>
                                      ))}
                                    </List>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                      <input
                                        style={{ flex: 1, padding: 4, border: '1px solid #ddd', borderRadius: 4 }}
                                        placeholder="코멘트 입력..."
                                        value={commentInputs[`goal-${goal.id}`] || ""}
                                        onChange={e => setCommentInputs(inputs => ({ ...inputs, [`goal-${goal.id}`]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddComment('goal', goal.id); }}
                                      />
                                      <MuiButton size="small" onClick={() => handleAddComment('goal', goal.id)}>등록</MuiButton>
                                    </Box>
                                  </Box>
                                </>
                              )}
                            </Box>
                          </>}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
              <Box mt={2}>
                <Typography variant="h6">반성문 전체</Typography>
                {(studentReflections[selected.id] ?? []).length === 0 ? (
                  <Typography color="text.secondary">반성문 기록 없음</Typography>
                ) : (
                  <List>
                    {(studentReflections[selected.id] ?? []).map(ref => (
                      <ListItem key={ref.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <ListItemText primary={`[${ref.date}] ${ref.text}`} />
                        {/* 반성문별 교사 코멘트 */}
                        <Box sx={{ width: '100%', mt: 0.5 }}>
                          <Typography variant="caption" color="secondary">반성문 코멘트</Typography>
                          <List dense sx={{ pl: 2 }}>
                            {comments.filter(c => c.targetType === "reflection" && c.targetId === ref.id).map((c, idx) => (
                              <ListItem key={idx} sx={{ pl: 0 }}>
                                <ListItemText primary={c.comment} secondary={`by ${c.teacher} (${c.created_at.slice(0, 16).replace('T',' ')})`} />
                              </ListItem>
                            ))}
                          </List>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <input
                              style={{ flex: 1, padding: 4, border: '1px solid #ddd', borderRadius: 4 }}
                              placeholder="코멘트 입력..."
                              value={commentInputs[`reflection-${ref.id}`] || ""}
                              onChange={e => setCommentInputs(inputs => ({ ...inputs, [`reflection-${ref.id}`]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddComment('reflection', ref.id); }}
                            />
                            <MuiButton size="small" onClick={() => handleAddComment('reflection', ref.id)}>등록</MuiButton>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </>
          )}
        {/* 목표별 달성률 변화 차트 모달 */}
        <Dialog open={!!openGoalChartId} onClose={() => setOpenGoalChartId(null)} maxWidth="sm" fullWidth>
          <DialogTitle>달성률 변화 차트</DialogTitle>
          <DialogContent>
            {openGoalChartId && (studentSessions[openGoalChartId] ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={studentSessions[openGoalChartId]?.map((s, idx) => ({
                  idx: idx + 1,
                  date: s.created_at,
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
            <MuiButton onClick={() => setOpenGoalChartId(null)}>닫기</MuiButton>
          </DialogActions>
        </Dialog>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setSelected(null)}>닫기</MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
