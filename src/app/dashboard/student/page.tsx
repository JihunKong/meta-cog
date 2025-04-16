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
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from "date-fns";
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

// 과목별 색상 지정 함수
const getSubjectColor = (subject: string): string => {
  const colorMap: Record<string, string> = {
    "국어": "#e57373", // 빨간계열
    "영어": "#64b5f6", // 파란계열
    "수학": "#81c784", // 초록계열
    "과학": "#9575cd", // 보라계열
    "사회": "#ffb74d"  // 주황계열
  };
  
  return colorMap[subject] || "#90a4ae"; // 기본값
};

// 달력 일자 생성 함수
const generateCalendarDays = (): (Date | null)[] => {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  // 해당 월의 모든 날짜 가져오기
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth
  });
  
  // 첫째 주의 첫째 날 채우기
  const startWeekday = firstDayOfMonth.getDay(); // 0: 일요일, 1: 월요일, ...
  const prefixDays = Array(startWeekday).fill(null);
  
  // 마지막 주의 마지막 날 채우기
  const endWeekday = lastDayOfMonth.getDay();
  const suffixDays = Array(6 - endWeekday).fill(null);
  
  return [...prefixDays, ...daysInMonth, ...suffixDays];
};

// AI 어드바이스 생성 함수
const getAIAdvice = (subject: string, average: number): string => {
  if (average >= 90) {
    return `${subject} 학습에서 탁월한 성과를 보이고 있습니다! 현재의 학습 방식을 유지하되, 지식을 더 깊이 탐구하는 심화 학습을 시도해보세요. 다른 과목과의 연계성을 찾아보거나 실생활 적용 방안을 고민해보는 것도 좋은 방법입니다.`;
  } else if (average >= 70) {
    return `${subject} 학습에서 양호한 성과를 보이고 있습니다. 잘 이해하지 못한 개념을 다시 검토하고, 개념 간의 연결고리를 파악하는 데 집중해보세요. 다양한 문제 유형을 접하면 학습 효과가 더욱 높아질 것입니다.`;
  } else if (average >= 50) {
    return `${subject} 학습에서 기본적인 성과를 내고 있습니다. 기초 개념을 확실히 이해했는지 점검하고, 부족한 부분은 다양한 방식으로 반복 학습해보세요. 학습 시간을 조금 더 늘리고 집중도를 높이면 성과가 개선될 것입니다.`;
  } else {
    return `${subject} 학습에 어려움을 겪고 있군요. 기초 개념부터 차근차근 다시 학습해보는 것을 추천합니다. 짧은 시간이라도 매일 꾸준히 학습하고, 어려운 부분은 선생님이나 친구에게 도움을 요청해보세요. 학습 방식을 바꿔보는 것도 좋은 방법입니다.`;
  }
};

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
              return {
                ...session,
                percent: null,
                reflection: null
              };
            });
          } catch (e) {
            console.error('Failed to parse session metadata:', e);
            // 오류 발생 시 기본값 추가
            sessionData = sessionData.map(session => ({
              ...session,
              percent: null,
              reflection: null
            }));
          }
        } else {
          // 메타데이터가 없을 경우 기본값 추가
          sessionData = sessionData.map(session => ({
            ...session,
            percent: null,
            reflection: null
          }));
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
      
      // 모든 세션 개수 카운트
      sessions.forEach(session => {
        if (!subjectData[session.subject]) {
          subjectData[session.subject] = { count: 0, total: 0 };
        }
        subjectData[session.subject].count++;
      });

      // percent가 있는 세션만 합계
      sessions.forEach(session => {
        if (session.percent) {
          // 이미 카운트는 위에서 추가했으니 total만 추가
          subjectData[session.subject].total += session.percent;
        }
      });
      
      return Object.entries(subjectData).map(([subject, data]) => ({
        subject,
        count: data.count,
        // 달성률이 있는 경우에만 평균 계산, 아니면 0
        average: data.total > 0 ? Math.round(data.total / data.count) : 0 
      }));
    })(),
    
    // 최근 달성률 추이
    recentPerformance: (() => {
      const sessionsWithPercent = sessions.filter(session => session.percent != null);
      
      // 달성률이 있는 세션이 없으면 빈 배열 반환
      if (sessionsWithPercent.length === 0) {
        return [];
      }
      
      return sessionsWithPercent
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
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="학습 세션" />
        <Tab label="달력 뷰" />
        <Tab label="통계 및 분석" />
        <Tab label="AI 어드바이스" />
      </Tabs>
      
      {/* 탭 1: 학습 세션 관리 */}
      {activeTab === 0 && (
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
      )}
      
      {/* 탭 2: 달력 뷰 */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>일자별 학습 활동</Typography>
          
          {sessions.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              아직 등록된 학습 세션이 없습니다. 학습 세션을 추가해보세요.
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* 달력 헤더 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{format(new Date(), 'yyyy년 MM월')}</Typography>
                <Box>
                  {/* 나중에 월 넘기기 버튼 추가 가능 */}
                </Box>
              </Box>
              
              {/* 요일 표시 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: 1 }}>
                {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                  <Typography key={i} sx={{ fontWeight: 'bold', color: i === 0 ? 'error.main' : 'text.primary' }}>
                    {day}
                  </Typography>
                ))}
              </Box>
              
              {/* 달력 그리드 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {generateCalendarDays().map((day, i) => {
                  // 해당 날짜의 세션 찾기
                  const dayStr = day ? format(day, 'yyyy-MM-dd') : '';
                  const daySessions = sessions.filter(s => s.created_at.substring(0, 10) === dayStr);
                  const hasSession = daySessions.length > 0;
                  
                  // 오늘 날짜와 현재 월의 날짜인지 확인
                  const isCurrentDay = day && isToday(day);
                  const isCurrentMonth = day && day.getMonth() === new Date().getMonth();
                  
                  return (
                    <Box 
                      key={i} 
                      sx={{
                        p: 1,
                        height: '100px',
                        border: '1px solid',
                        borderColor: isCurrentDay ? 'primary.main' : 'grey.300',
                        borderRadius: 1,
                        backgroundColor: isCurrentDay ? 'primary.50' : (isCurrentMonth ? 'background.paper' : 'grey.50'),
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          cursor: hasSession ? 'pointer' : 'default',
                        }
                      }}
                      onClick={() => {
                        if (hasSession) {
                          // 추후 세션 상세 보기 기능 추가 가능
                        }
                      }}
                    >
                      {day && (
                        <>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: isCurrentDay ? 'bold' : 'normal',
                              color: !isCurrentMonth ? 'text.disabled' : 
                                     format(day, 'E') === 'Sun' ? 'error.main' : 
                                     'text.primary'
                            }}
                          >
                            {format(day, 'd')}
                          </Typography>
                          
                          {hasSession && (
                            <Box sx={{ mt: 'auto' }}>
                              {daySessions.map((session, idx) => (
                                <Box 
                                  key={idx} 
                                  sx={{ 
                                    mt: 0.5, 
                                    p: 0.5, 
                                    bgcolor: getSubjectColor(session.subject), 
                                    borderRadius: 0.5,
                                    fontSize: '0.7rem',
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {session.subject}: {session.percent ? `${session.percent}%` : '진행중'}
                                </Box>
                              ))}
                              
                              {daySessions.length > 2 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  +{daySessions.length - 2} 더 보기
                                </Typography>
                              )}
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  );
                })}
              </Box>
              
              {/* 과목별 색상 밸런스 */}
              <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {SUBJECTS.map(subject => (
                  <Box key={subject} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getSubjectColor(subject), mr: 1 }} />
                    <Typography variant="caption">{subject}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      {/* 탭 3: 통계 및 분석 */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>통계 및 학습 분석</Typography>
          
          {sessions.filter(s => s.percent != null && s.percent > 0).length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              아직 완료된 학습 세션이 없습니다. 학습을 완료하고 통계를 확인해보세요.
            </Alert>
          ) : (
            <Grid container spacing={4}>
              {/* 최근 달성률 추이 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>최근 달성률 추이</Typography>
                <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  {statsData.recentPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={statsData.recentPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Line type="monotone" dataKey="percent" stroke="#1976d2" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="text.secondary">아직 데이터가 없습니다</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              
              {/* 과목별 평균 달성률 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>과목별 평균 달성률</Typography>
                <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  {statsData.subjectPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData.subjectPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="average" fill="#1976d2" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="text.secondary">아직 데이터가 없습니다</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              
              {/* 요일별 학습 빈도 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>최근 4주간 요일별 학습 빈도</Typography>
                <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  {statsData.weekdayFrequency.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData.weekdayFrequency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1976d2" name="학습 횟수" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="text.secondary">아직 데이터가 없습니다</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      {/* 탭 4: AI 어드바이스 */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>AI 학습 어드바이스</Typography>
          
          {sessions.filter(s => s.percent).length < 3 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              AI 학습 어드바이스를 받으려면 최소 3개 이상의 학습 세션을 완료해야 합니다.
            </Alert>
          ) : (
            <Box>
              {statsData.subjectPerformance.map(subject => (
                <Box key={subject.subject} sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="h6" gutterBottom>
                    {subject.subject} 학습 리포트
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>평균 달성률:</strong> {subject.average}%
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>세션 횟수:</strong> {subject.count} 회
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    AI 학습 어드바이스
                  </Typography>
                  
                  <Box sx={{ p: 2, bgcolor: '#e8f4fd', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      {getAIAdvice(subject.subject, subject.average)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="outlined" size="small">
                      새로운 어드바이스 요청
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
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
