"use client";

import { useState } from "react";
import {
  Box, Typography, Grid, Button, CircularProgress, Alert, Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SessionItem from "./SessionItem";

interface Session {
  id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
}

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
  error: string;
  handleAddSession: () => void;
  handleEditSession: (sessionId: string) => void;
  handleSaveSession: (sessionId: string, data: {
    subject: string;
    description: string;
    percent: string;
    reflection: string;
  }) => void;
  handleDeleteSession: (sessionId: string) => void;
  editingSessionId: string | null;
  saveLoading: boolean;
  closeEdit: () => void;
}

export default function SessionList({
  sessions,
  loading,
  error,
  handleAddSession,
  handleEditSession,
  handleSaveSession,
  handleDeleteSession,
  editingSessionId,
  saveLoading,
  closeEdit
}: SessionListProps) {
  const today = new Date().toISOString().slice(0, 10);
  const hasTodaySession = sessions.some(s => s.created_at.slice(0, 10) === today);
  
  // 세션을 날짜별로 그룹화
  const groupedSessions = sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const date = session.created_at.slice(0, 10);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {});
  
  // 날짜 기준으로 정렬된 키 배열 생성 (최신순)
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (sessions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>등록된 학습 세션이 없습니다</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          "학습 세션 추가" 버튼을 클릭하여 오늘의 학습 목표를 설정해보세요.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSession}
        >
          학습 세션 추가
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {!hasTodaySession && (
        <Alert severity="info" sx={{ mb: 3 }}>
          오늘의 학습 세션이 없습니다. 새로운 학습 세션을 추가해보세요!
        </Alert>
      )}
      
      {sortedDates.map(date => {
        const sessionsForDate = groupedSessions[date];
        const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
          year: "numeric", 
          month: "long", 
          day: "numeric",
          weekday: "long"
        });
        
        return (
          <Box key={date} sx={{ mb: 4 }}>
            <Box sx={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              mb: 2,
              borderBottom: "1px solid #eee",
              pb: 1
            }}>
              <Typography variant="h6">
                {formattedDate}
                {date === today && (
                  <Chip label="오늘" color="primary" size="small" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {sessionsForDate.map(session => (
                <Grid item xs={12} md={6} lg={4} key={session.id}>
                  <SessionItem
                    session={session}
                    isEditing={editingSessionId === session.id}
                    openEdit={handleEditSession}
                    closeEdit={closeEdit}
                    handleSave={handleSaveSession}
                    handleDelete={handleDeleteSession}
                    saveLoading={saveLoading}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
    </Box>
  );
}
