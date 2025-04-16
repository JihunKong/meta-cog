"use client";

import { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Alert, CircularProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  TextField, Slider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { supabase } from "@/lib/supabase";
import SessionList from "./SessionList";

// 과목 목록
const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

interface Session {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
}

interface SessionManagerProps {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
}

export default function SessionManager({
  sessions,
  setSessions
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

  // 세션 추가 핸들러
  const handleAddSession = async (sessionData: { subject: string; description: string }) => {
    try {
      setLoading(true);
      setError("");

      // 데이터베이스에 모든 필드 저장 (테이블 스키마 업데이트 완료)
      const { data, error } = await supabase
        .from('smart_goals')
        .insert([{
          subject: sessionData.subject,
          description: sessionData.description,
          percent: 0,  // 새 세션은 초기값 0
          reflection: ''  // 새 세션은 초기값 빈 문자열
        }])
        .select();

      if (error) throw error;

      // 새 세션을 로컬 상태에 추가
      if (data && data.length > 0) {
        // 이제 데이터베이스에 저장된 모든 필드를 포함한 세션 데이터 사용
        setSessions([data[0], ...sessions]);
      }

      // 대화상자 닫기
      setIsDialogOpen(false);
      setNewSessionData({ subject: SUBJECTS[0], description: "" });
    } catch (err: any) {
      console.error("세션 추가 오류:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 세션 업데이트 핸들러
  const handleUpdateSession = async (id: string, updatedData: { subject: string; description: string; percent: number; reflection: string }) => {
    try {
      setLoading(true);
      setError("");
      
      // 업데이트할 세션 찾기
      const sessionToUpdate = sessions.find(s => s.id === id);
      if (!sessionToUpdate) {
        throw new Error("세션을 찾을 수 없습니다");
      }

      // 데이터베이스에 모든 필드 업데이트 (테이블 스키마 업데이트 완료)
      const { error } = await supabase
        .from('smart_goals')
        .update({
          subject: updatedData.subject,
          description: updatedData.description,
          percent: updatedData.percent,
          reflection: updatedData.reflection
        })
        .eq('id', id);

      if (error) throw error;

      // 현재 세션 업데이트
      const updatedSession = {
        ...sessionToUpdate,
        subject: updatedData.subject,
        description: updatedData.description,
        percent: updatedData.percent,
        reflection: updatedData.reflection
      };

      // 로컬 스토리지 사용 안 함 - 데이터베이스에 직접 저장함

      // 로컬 세션 리스트 업데이트
      setSessions(sessions.map(s => s.id === id ? updatedSession : s));

      // 편집 모드 종료
      setEditingSessionId(null);
      setCurrentSession(null);
    } catch (err: any) {
      console.error("세션 업데이트 오류:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 세션 삭제 핸들러
  const handleDeleteSession = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      const { error } = await supabase
        .from('smart_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 세션 리스트에서 삭제
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err: any) {
      console.error("세션 삭제 오류:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 세션 편집 시작
  const handleEditStart = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      // 이제 percent와 reflection이 데이터베이스에 저장되어 있으므로 세션 객체에서 값을 바로 가져온다
      setCurrentSession({
        ...session,
        percent: session.percent || 0,
        reflection: session.reflection || ""
      });
      setEditingSessionId(sessionId);
    }
  };

  // 세션 편집 취소
  const handleEditCancel = () => {
    setEditingSessionId(null);
    setCurrentSession(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">학습 세션</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
          disabled={loading}
        >
          새 세션 추가
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}

      <SessionList 
        sessions={sessions}
        onEdit={handleEditStart}
        onDelete={handleDeleteSession}
        editingSessionId={editingSessionId}
        onUpdate={handleUpdateSession}
        loading={loading}
      />

      {/* 세션 추가 다이얼로그 */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>새 학습 세션 추가</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="add-subject-label">과목</InputLabel>
            <Select
              labelId="add-subject-label"
              value={newSessionData?.subject || SUBJECTS[0]}
              onChange={(e) => setNewSessionData(prev => ({...prev, subject: e.target.value as string}))}
              label="과목"
            >
              {SUBJECTS.map(subject => (
                <MenuItem key={subject} value={subject}>{subject}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            label="학습 내용"
            fullWidth
            multiline
            rows={4}
            value={newSessionData?.description || ""}
            onChange={(e) => setNewSessionData(prev => ({...prev, description: e.target.value}))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} disabled={loading}>취소</Button>
          <Button 
            onClick={() => {
              if (newSessionData) {
                handleAddSession(newSessionData);
              }
            }} 
            color="primary" 
            variant="contained" 
            disabled={loading || !newSessionData?.subject || !newSessionData?.description}
          >
            {loading ? <CircularProgress size={24} /> : "추가"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 세션 편집 다이얼로그 */}
      {currentSession && (
        <Dialog open={editingSessionId !== null} onClose={handleEditCancel} fullWidth maxWidth="sm">
          <DialogTitle>세션 수정</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel id="edit-subject-label">과목</InputLabel>
              <Select
                labelId="edit-subject-label"
                value={currentSession.subject}
                onChange={(e) => setCurrentSession(prev => 
                  prev ? {...prev, subject: e.target.value as string} : null
                )}
                label="과목"
              >
                {SUBJECTS.map(subject => (
                  <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              label="학습 내용"
              fullWidth
              multiline
              rows={4}
              value={currentSession.description}
              onChange={(e) => setCurrentSession(prev => 
                prev ? {...prev, description: e.target.value} : null
              )}
            />

            <Box sx={{ mt: 3, mb: 1 }}>
              <Typography id="percent-slider" gutterBottom>
                달성도: {currentSession.percent}%
              </Typography>
              <Slider
                value={currentSession.percent || 0}
                onChange={(_, newValue) => setCurrentSession(prev => 
                  prev ? {...prev, percent: newValue as number} : null
                )}
                aria-labelledby="percent-slider"
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
              />
            </Box>

            <TextField
              margin="normal"
              label="학습 반성"
              fullWidth
              multiline
              rows={4}
              value={currentSession.reflection}
              onChange={(e) => setCurrentSession(prev => 
                prev ? {...prev, reflection: e.target.value} : null
              )}
              placeholder="이번 학습에서 어려웠던 점과 개선할 점을 적어보세요."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditCancel} disabled={loading}>취소</Button>
            <Button 
              onClick={() => {
                if (currentSession) {
                  handleUpdateSession(currentSession.id, {
                    subject: currentSession.subject,
                    description: currentSession.description,
                    percent: currentSession.percent || 0,
                    reflection: currentSession.reflection || ''
                  });
                }
              }}
              color="primary" 
              variant="contained" 
              disabled={loading || !currentSession.subject || !currentSession.description}
            >
              {loading ? <CircularProgress size={24} /> : "저장"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
