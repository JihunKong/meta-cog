"use client";

import { useState } from "react";
import {
  Box, Typography, Button, CircularProgress, TextField,
  Card, CardContent, Grid, Chip
} from "@mui/material";

interface GoalSession {
  id: string;
  smart_goal_id: string;
  session_no: number;
  percent: number;
  reflection: string;
  created_at: string;
}

interface SessionCardProps {
  goalId: string;
  sessionNo: number;
  session: GoalSession | undefined;
  isEditing: boolean;
  sessionForm: {
    percent: string;
    reflection: string;
  };
  sessionSaveLoading: boolean;
  setSessionForm: (value: React.SetStateAction<{
    percent: string;
    reflection: string;
  }>) => void;
  openSessionEdit: (goalId: string, sessionNo: number) => void;
  closeSessionEdit: () => void;
  handleSessionSave: (goalId: string, sessionNo: number) => void;
  handleSessionDelete: (goalId: string, sessionNo: number) => void;
}

export default function SessionCard({
  goalId,
  sessionNo,
  session,
  isEditing,
  sessionForm,
  sessionSaveLoading,
  setSessionForm,
  openSessionEdit,
  closeSessionEdit,
  handleSessionSave,
  handleSessionDelete
}: SessionCardProps) {
  return (
    <Grid item xs={12} md={4} key={sessionNo}>
      <Card 
        variant="outlined" 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderWidth: session ? 2 : 1,
          borderColor: session ? '#1976d2' : '#e0e0e0',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 2
          }
        }}
      >
        <Box sx={{
          bgcolor: session ? '#e3f2fd' : '#f5f5f5',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            학습 세션 {sessionNo}
          </Typography>
          {session && (
            <Chip 
              label={`${session.percent}% 달성`} 
              color="primary" 
              size="small" 
              variant="outlined" 
            />
          )}
        </Box>
        
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {isEditing ? (
            <Box component="form" onSubmit={e => {e.preventDefault(); handleSessionSave(goalId, sessionNo);}} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                학습 완료 후 달성도와 반성을 기록해주세요.
              </Typography>
              <TextField
                label="달성도 (%)"
                type="number"
                value={sessionForm.percent}
                onChange={e => setSessionForm(f => ({...f, percent: e.target.value}))}
                inputProps={{ min: 0, max: 100 }}
                fullWidth
                margin="normal"
                required
                size="small"
                helperText="0~100 사이의 숫자를 입력해주세요"
              />
              <TextField
                label="학습 반성"
                placeholder="오늘의 학습을 돌아보며 느낀 점을 적어주세요..."
                multiline
                rows={3}
                value={sessionForm.reflection}
                onChange={e => setSessionForm(f => ({...f, reflection: e.target.value}))}
                fullWidth
                margin="normal"
                size="small"
              />
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button 
                  onClick={closeSessionEdit} 
                  sx={{ mr: 1 }}
                  size="small"
                  disabled={sessionSaveLoading}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={!sessionForm.percent || sessionSaveLoading}
                  size="small"
                >
                  {sessionSaveLoading ? "저장 중..." : "저장"}
                </Button>
              </Box>
            </Box>
          ) : session ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <b>반성:</b>
                </Typography>
                <Typography variant="body2" sx={{ 
                  bgcolor: '#f9f9f9', 
                  p: 1.5, 
                  borderRadius: 1,
                  minHeight: '80px',
                  whiteSpace: 'pre-line'
                }}>
                  {session.reflection || "(반성 내용이 없습니다.)"}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 2,
                pt: 1,
                borderTop: '1px solid #eee'
              }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(session.created_at).toLocaleDateString()}
                </Typography>
                
                <Box>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => openSessionEdit(goalId, sessionNo)}
                    sx={{ mr: 1 }}
                  >
                    수정
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    variant="outlined"
                    onClick={() => handleSessionDelete(goalId, sessionNo)}
                  >
                    삭제
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              py: 3,
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                아직 등록된 학습 기록이 없습니다.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                size="small" 
                onClick={() => openSessionEdit(goalId, sessionNo)}
                sx={{ mt: 2 }}
              >
                학습 기록 추가
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
}
