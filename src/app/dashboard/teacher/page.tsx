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

  // 전체 요약 통계
  const [summary, setSummary] = useState<{goalCount:number, sessionCount:number, reflectionCount:number, avgPercent:number} | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      setError(null);
      // TODO: 실제 Supabase에서 학생 데이터 가져오기
      // 임시 더미 데이터
      const dummyStudents = [
        { id: "1", email: "student1@email.com", name: "홍길동", last_login: "2025-04-10" },
        { id: "2", email: "student2@email.com", name: "김영희", last_login: "2025-04-12" },
      ];
      setStudents(dummyStudents);
      // 각 학생별 목표/세션/반성문 더미 데이터 생성
      setStudentGoals({
        "1": [
          { id: "g1", subject: "수학 실력 향상", description: "매일 30분 수학 공부", created_at: "2025-03-01" },
          { id: "g2", subject: "영어 독해력 강화", description: "주 3회 영어 기사 읽기", created_at: "2025-03-10" },
        ],
        "2": [
          { id: "g3", subject: "코딩 실습", description: "매주 2회 알고리즘 문제 풀기", created_at: "2025-03-05" },
        ]
      });
      setStudentSessions({
        "g1": [
          { id: "s1", created_at: "2025-04-01", percent: 80, reflection: "오늘은 집중이 잘 됐다." },
          { id: "s2", created_at: "2025-04-02", percent: 90, reflection: "문제풀이가 쉬웠다." },
        ],
        "g2": [
          { id: "s3", created_at: "2025-04-01", percent: 60, reflection: "영어가 어려웠다." }
        ],
        "g3": [
          { id: "s4", created_at: "2025-04-03", percent: 100, reflection: "알고리즘 문제를 전부 풀었다." }
        ]
      });
      setStudentReflections({
        "1": [
          { id: "s1", goalId: "g1", date: "2025-04-01", text: "오늘은 집중이 잘 됐다." },
          { id: "s2", goalId: "g1", date: "2025-04-02", text: "문제풀이가 쉬웠다." },
          { id: "s3", goalId: "g2", date: "2025-04-01", text: "영어가 어려웠다." }
        ],
        "2": [
          { id: "s4", goalId: "g3", date: "2025-04-03", text: "알고리즘 문제를 전부 풀었다." }
        ]
      });
      // 전체 요약 통계 계산
      const allSessions = [
        ...studentSessions["g1"] ?? [],
        ...studentSessions["g2"] ?? [],
        ...studentSessions["g3"] ?? [],
      ];
      const allReflections = [
        ...studentReflections["1"] ?? [],
        ...studentReflections["2"] ?? [],
      ];
      setSummary({
        goalCount: 3,
        sessionCount: allSessions.length,
        reflectionCount: allReflections.length,
        avgPercent: allSessions.length ? Math.round(allSessions.reduce((a, b) => a + b.percent, 0) / allSessions.length) : 0
      });
      setLoading(false);
    }
    fetchStudents();
  }, []);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>교사 대시보드</Typography>
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
