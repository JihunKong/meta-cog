"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography, Modal, CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Card, CardContent, MenuItem, Alert } from "@mui/material";
import { getFirebaseInstance } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';

// 컴포넌트 가져오기
import StudentList from "./components/StudentList";
import GoalsList from "./components/GoalsList";
import GoalDetails from "./components/GoalDetails";
import FeedbackDialog from "./components/FeedbackDialog";
import StudentListGrid from "./components/StudentListGrid";
import StudentStatsSummary from "./components/StudentStatsSummary";
import StudentLeaderboard from "./components/StudentLeaderboard";
import ImprovedStudentLeaderboard from "./components/ImprovedStudentLeaderboard";
import StudentDetailsModal from "./components/StudentDetailsModal";

// 타입 가져오기
import { User, Goal, Session, Reflection } from "./types";

export default function TeacherDashboard() {
  const router = useRouter();
  
  // 학생 관련 상태
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 학생별 세션/목표/통계 상태
  const [studentStats, setStudentStats] = useState<Record<string, any>>({});

  // 검색 상태
  const [search, setSearch] = useState('');

  // --- 피드백 및 세부 정보 관련 상태 추가 ---
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<User | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedSessionForFeedback, setSelectedSessionForFeedback] = useState<Session | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  // ------------------------------------------

  // 학생 데이터 및 세션/목표 데이터 동시 로드 (API 호출 방식으로 변경)
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      setError(null);
      let studentsList: User[] = [];
      let studentStatsData: any = {};
      
      try {
        const { auth } = getFirebaseInstance();
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error("로그인되어 있지 않습니다.");
        }
        
        // API를 통한 학생 목록 조회
        const response = await fetch(`/api/teacher/get-students?teacher_id=${user.uid}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '학생 목록을 불러오는 중 오류가 발생했습니다.');
        }
        
        const { students } = await response.json();
        
        // 학생 데이터 변환
        studentsList = students.map((student: any) => ({
          user_id: student.id,
          email: student.email || "이메일 없음",
          name: student.name || (student.email ? student.email.split('@')[0] : "이름 없음"),
          role: "student",
          school: student.school || '',
          grade: student.grade || '',
          classNum: student.classNum || '',
          studentNum: student.studentNum || ''
        }));
        
        if (studentsList.length > 0) {
          const stats: Record<string, any> = {};
          
          // 각 학생별 세션 데이터 조회
          for (const student of studentsList) {
            // API를 통한 학생 세션 데이터 조회
            const sessionResponse = await fetch(`/api/teacher/get-student-sessions?teacher_id=${user.uid}&student_id=${student.user_id}`);
            
            if (!sessionResponse.ok) {
              console.warn(`학생 ${student.name}(의) 세션 데이터를 불러오는 중 오류가 발생했습니다.`);
              continue;
            }
            
            const { sessions: studentSessions } = await sessionResponse.json();
            
            // 세션 데이터 매핑 시 타입 안정성 강화
            const sessions: Session[] = studentSessions.map((session: any) => {
              // 필수 필드 확인 및 기본값 제공
              return {
                id: session.id,
                user_id: session.user_id || student.user_id, // user_id 없으면 student.user_id 사용
                duration: session.duration || 0,
                percent: session.percent || 0,
                date: session.date || null, // date 필드 사용 시 확인 필요
                notes: session.notes || session.description || '',
                reflection: session.reflection || '',
                created_at: session.created_at || null, // created_at 타입 확인 필요
                subject: session.subject || undefined,
                teacher_feedback: session.teacher_feedback || undefined
              } as Session;
            });

            // 학생의 목표 데이터는 현재 구현되지 않았으므로 빈 배열로 처리
            let goals: any[] = [];

            let avgPercent = 0, reflectionCount = 0, sessionCount = sessions.length;
            if (sessionCount > 0) {
              avgPercent = Math.round(sessions.reduce((sum, s) => sum + (s.percent || 0), 0) / sessionCount);
              reflectionCount = sessions.filter(s => s.reflection && s.reflection.length > 0).length;
            }
            const reflectionRate = sessionCount > 0 ? Math.round((reflectionCount / sessionCount) * 100) : 0;

            stats[student.user_id] = { avgPercent, sessionCount, reflectionCount, reflectionRate, goals, sessions };
          }
          studentStatsData = stats;
        }
        
        if (mounted) {
            setStudents(studentsList);
            setStudentStats(studentStatsData);
        }

      } catch (err: any) {
        console.error('Error loading data:', err);
        if (mounted) setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  // 학생 카드형 리스트 렌더링
  console.log("Rendering - students:", students);
  console.log("Rendering - studentStats:", studentStats);

  // --- 핸들러 함수 --- 
  const handleDetailsOpen = (student: User) => {
    setSelectedStudentForDetails(student);
    setDetailsModalOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsModalOpen(false);
    setSelectedStudentForDetails(null);
  };

  const handleFeedbackOpen = (session: Session) => {
    setSelectedSessionForFeedback(session);
    setFeedbackText(session.teacher_feedback || ''); 
    setFeedbackError(null);
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackClose = () => {
    setFeedbackDialogOpen(false);
    setSelectedSessionForFeedback(null);
    setFeedbackText('');
    setFeedbackError(null);
  };

  const handleFeedbackChange = (text: string) => {
    setFeedbackText(text);
  };

  const handleFeedbackSave = async () => {
    if (!selectedSessionForFeedback) {
      setFeedbackError('피드백을 저장할 세션 정보가 없습니다.');
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const { auth } = getFirebaseInstance();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('로그인되어 있지 않습니다.');
      }
      
      // API를 통한 피드백 저장
      const response = await fetch('/api/teacher/add-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: user.uid,
          sessionId: selectedSessionForFeedback.id,
          feedback: feedbackText.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '피드백 저장 중 오류가 발생했습니다.');
      }

      setStudentStats(prevStats => {
        const studentId = selectedSessionForFeedback.user_id; 
        if (!studentId || !prevStats[studentId]) return prevStats;

        const updatedSessions = prevStats[studentId].sessions.map((s: Session) => 
          s.id === selectedSessionForFeedback.id ? { ...s, teacher_feedback: feedbackText.trim() } : s
        );
        return {
          ...prevStats,
          [studentId]: {
            ...prevStats[studentId],
            sessions: updatedSessions
          }
        };
      });

      handleFeedbackClose();

    } catch (err: any) {
      console.error('피드백 저장 오류:', err);
      setFeedbackError('피드백 저장 중 오류가 발생했습니다.');
    } finally {
      setFeedbackLoading(false);
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">교사 대시보드</Typography>
        <LogoutButton variant="icon" size="large" />
      </Box>
      
      {/* 로딩 및 에러 처리 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* 전체 통계 요약 */}
          <StudentStatsSummary students={students} studentStats={studentStats} />
          
          {/* 개선된 리더보드 */}
          <ImprovedStudentLeaderboard students={students} studentStats={studentStats} topN={5} />

          {/* 학생 검색 */}
          <Box mb={2}>
            <TextField
              type="text"
              placeholder="학생 이름 또는 이메일 검색"
              fullWidth // 너비 조정
              value={search}
              onChange={e => setSearch(e.target.value)}
              variant="outlined" // 디자인 변경
              size="small" // 크기 조정
            />
          </Box>
          
          {/* 학생 카드 목록 */}
          <StudentListGrid 
            students={students} 
            studentStats={studentStats} 
            search={search} 
            onViewDetails={handleDetailsOpen}
          />
        </>
      )}

      {/* 세부 정보 모달 */}
      <StudentDetailsModal
        open={detailsModalOpen}
        onClose={handleDetailsClose}
        student={selectedStudentForDetails}
        studentStats={selectedStudentForDetails ? studentStats[selectedStudentForDetails.user_id] : { sessions: [] }}
        onOpenFeedbackDialog={handleFeedbackOpen}
      />

      {/* 피드백 다이얼로그 */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={handleFeedbackClose}
        session={selectedSessionForFeedback}
        feedbackText={feedbackText}
        onFeedbackChange={handleFeedbackChange}
        onSave={handleFeedbackSave}
        loading={feedbackLoading}
        error={feedbackError}
      />
    </Box>
  );
}
