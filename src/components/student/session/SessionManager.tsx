"use client";

import { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Alert, CircularProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  TextField, Slider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { getFirebaseInstance } from "@/lib/firebase";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
  query, where, orderBy, Timestamp, serverTimestamp 
} from "firebase/firestore";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import SessionList from "./SessionList";

// 과목 목록
const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

// 세션 인터페이스
interface Session {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
  progress_id?: string;
  teacher_feedback?: string;
}

interface SessionManagerProps {
  sessions: Session[];
  onDelete: (sessionId: string) => Promise<void>;
  onUpdate: (sessionId: string, data: any) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function SessionManager({
  sessions,
  onDelete,
  onUpdate,
  onRefresh
}: SessionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [newSessionData, setNewSessionData] = useState<{
    subject: string;
    description: string;
  }>({ subject: SUBJECTS[0], description: "" });
  const [editField, setEditField] = useState<{
    subject: string;
    description: string;
    percent: number;
    reflection: string;
  }>({ subject: "", description: "", percent: 0, reflection: "" });

  // Firebase 인스턴스 가져오기
  const { db, auth: firebaseAuth } = getFirebaseInstance();
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Firebase 인증 상태 감시 및 관리
  useEffect(() => {
    // 인증 상태 디버깅
    console.log('Firebase 인증 상태 초기값:', {
      'auth.currentUser': auth?.currentUser,
      'firebaseAuth.currentUser': firebaseAuth?.currentUser
    });
    
    // 인증 상태 변경 리스너 설정
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      console.log('Firebase 인증 상태 변경:', user ? `${user.email} (${user.uid})` : '로그아웃 상태');
      setCurrentUser(user);
    });
    
    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [auth, firebaseAuth]);

  // 세션 목록은 props에서 직접 가져옴 (useState 불필요)

  // 다이얼로그 열기
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setNewSessionData({ subject: SUBJECTS[0], description: "" });
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setError("");
  };

  // 새 세션 추가
  const handleAddSession = async () => {
    // 입력 유효성 검사
    if (!newSessionData.subject || !newSessionData.description) {
      setError("과목과 설명을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 인증 상태 확인 상세 디버깅
      console.log('handleAddSession 인증 상태:', {
        stateCurrentUser: currentUser ? `${currentUser.email} (${currentUser.uid})` : '없음',
        authCurrentUser: auth?.currentUser ? `${auth.currentUser.email} (${auth.currentUser.uid})` : '없음'
      });
      
      if (!currentUser) {
        throw new Error("인증된 사용자가 없습니다. 다시 로그인해주세요.");
      }

      // 사용자 ID 디버깅
      console.log('User ID for new session:', currentUser.uid);

      // Firebase에 새 세션 추가
      const sessionsRef = collection(db, 'sessions');
      const sessionData = {
        user_id: currentUser.uid,
        subject: newSessionData.subject,
        description: newSessionData.description,
        percent: 0,
        reflection: "",
        created_at: serverTimestamp()
      };

      console.log('Adding session with data:', {
        ...sessionData,
        user_id: `${sessionData.user_id} (${currentUser.email})`
      });
      const docRef = await addDoc(sessionsRef, sessionData);
      console.log('Session added with ID:', docRef.id);
      
      // 새로고침 콜백 호출
      if (onRefresh) {
        await onRefresh();
      }
      
      handleCloseDialog();
    } catch (error: any) {
      // 오류 객체 디테일 출력 개선
      console.error("세션 추가 오류:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      const errorMsg = error?.message || JSON.stringify(error) || "세션을 추가하는 중 알 수 없는 오류가 발생했습니다.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 세션 편집 모드 열기
  const handleOpenEdit = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setEditingSessionId(sessionId);
      setCurrentSession(session);
      setEditField({
        subject: session.subject || '',
        description: session.description || '',
        percent: session.percent ?? 0,
        reflection: session.reflection || ''
      });
    }
  };

  // 세션 편집 모드 닫기
  const handleCloseEdit = () => {
    setEditingSessionId(null);
    setCurrentSession(null);
  };

  // 세션 수정 저장
  const handleSaveEdit = async (sessionId: string, data: any) => {
    setLoading(true);
    setError("");

    try {
      // 인증 상태 확인 및 디버깅
      console.log('handleSaveEdit 실행 시작 - 데이터:', {
        stateCurrentUser: currentUser ? `${currentUser.email} (${currentUser.uid})` : '없음',
        sessionId: sessionId,
        dataToUpdate: data,
        subject: data.subject,
        description: data.description,
        percent: data.percent,
        reflection: data.reflection
      });
      
      if (!currentUser) {
        throw new Error("인증된 사용자가 없습니다. 다시 로그인해주세요.");
      }

      // 부모 컴포넌트의 업데이트 메서드 호출
      if (onUpdate) {
        console.log('onUpdate 콜백 호출 전 - 세션ID:', sessionId, '데이터:', data);
        try {
          await onUpdate(sessionId, data);
          console.log('onUpdate 콜백 호출 성공!');
        } catch (updateError) {
          console.error('onUpdate 콜백 호출 실패:', updateError);
          throw updateError; // 에러를 상위로 전파
        }
      } else {
        console.warn('onUpdate 콜백이 존재하지 않습니다!');
      }

      // 새로고침 콜백 호출
      if (onRefresh) {
        await onRefresh();
      }

      handleCloseEdit();
    } catch (error: any) {
      // 오류 객체 디테일 출력 개선
      console.error("세션 수정 오류:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      const errorMsg = error?.message || JSON.stringify(error) || "세션을 수정하는 중 알 수 없는 오류가 발생했습니다.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 세션 삭제
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('정말로 이 세션을 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 인증 상태 확인 및 디버깅
      console.log('handleDeleteSession 인증 상태:', {
        stateCurrentUser: currentUser ? `${currentUser.email} (${currentUser.uid})` : '없음',
        sessionId: sessionId
      });
      
      if (!currentUser) {
        throw new Error("인증된 사용자가 없습니다. 다시 로그인해주세요.");
      }

      // 부모 컴포넌트의 삭제 메서드 호출
      if (onDelete) {
        await onDelete(sessionId);
      }

      // 새로고침 콜백 호출
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      // 오류 객체 디테일 출력 개선
      console.error("세션 삭제 오류:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      const errorMsg = error?.message || JSON.stringify(error) || "세션을 삭제하는 중 알 수 없는 오류가 발생했습니다.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* 세션 추가 버튼 및 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          학습 세션 관리
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          새 세션 추가
        </Button>
      </Box>

      {/* 세션 목록 */}
      <SessionList
        sessions={sessions}
        editingSessionId={editingSessionId}
        loading={loading}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteSession}
        onUpdate={(sessionId, data) => handleSaveEdit(sessionId, data)}
      />

      {/* 세션 추가 다이얼로그 */}
      <Dialog open={isDialogOpen && !editingSessionId} onClose={handleCloseDialog}>
        <DialogTitle>새 학습 세션 추가</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="subject-label">과목</InputLabel>
            <Select
              labelId="subject-label"
              value={newSessionData.subject || SUBJECTS[0]}
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
            fullWidth
            margin="normal"
            label="학습 목표"
            multiline
            rows={3}
            value={newSessionData.description}
            onChange={(e) => setNewSessionData({ ...newSessionData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button 
            onClick={handleAddSession} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "추가"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 세션 편집 다이얼로그 */}
      <Dialog open={!!editingSessionId} onClose={handleCloseEdit}>
        <DialogTitle>{(currentSession?.percent ?? 0) > 0 ? '학습 세션 수정' : '학습 완료 기록'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="edit-subject-label">과목</InputLabel>
            <Select
              labelId="edit-subject-label"
              name="subject"
              value={editField.subject || SUBJECTS[0]}
              label="과목"
              onChange={(e) => setEditField({ ...editField, subject: e.target.value })}
            >
              {SUBJECTS.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="학습 목표"
            name="description"
            multiline
            rows={3}
            value={editField.description}
            onChange={(e) => setEditField({ ...editField, description: e.target.value })}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography id="percent-slider" gutterBottom>
              달성도: {editField.percent}%
            </Typography>
            <Slider
              value={editField.percent}
              onChange={(e, newValue) => setEditField({ ...editField, percent: newValue as number })}
              aria-labelledby="percent-slider"
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
            />
          </Box>
          
          <TextField
            fullWidth
            margin="normal"
            label="학습 반성"
            name="reflection"
            multiline
            rows={4}
            value={editField.reflection}
            onChange={(e) => setEditField({ ...editField, reflection: e.target.value })}
            placeholder="오늘의 학습에 대한 반성을 작성해보세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>취소</Button>
          <Button 
            onClick={() => editingSessionId && handleSaveEdit(editingSessionId, editField)} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "저장"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
