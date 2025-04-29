"use client";

import { useState } from "react";
import {
  Box, Typography, Button, IconButton, Accordion, AccordionSummary, AccordionDetails,
  LinearProgress, Grid, CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SessionCard from "./SessionCard";

interface SmartGoal {
  id: string;
  subject: string;
  description: string;
  created_at: string;
}

interface GoalSession {
  id: string;
  smart_goal_id: string;
  session_no: number;
  percent: number;
  reflection: string;
  created_at: string;
}

interface GoalItemProps {
  goal: SmartGoal;
  sessions: Record<string, GoalSession[]>;
  sessionLoading: Record<string, boolean>;
  sessionError: Record<string, string>;
  sessionEdit: { goalId: string; sessionNo: number } | null;
  sessionForm: {
    percent: string;
    reflection: string;
  };
  sessionSaveLoading: boolean;
  setEditId: (goal: SmartGoal) => void;
  setDeleteId: (id: string | null) => void;
  setOpenReflectionGoalId: (id: string | null) => void;
  setOpenProgressGoalId: (id: string | null) => void;
  setSessionForm: (value: React.SetStateAction<{
    percent: string;
    reflection: string;
  }>) => void;
  openSessionEdit: (goalId: string, sessionNo: number) => void;
  closeSessionEdit: () => void;
  handleSessionSave: (goalId: string, sessionNo: number) => void;
  handleSessionDelete: (goalId: string, sessionNo: number) => void;
}

export default function GoalItem({
  goal,
  sessions,
  sessionLoading,
  sessionError,
  sessionEdit,
  sessionForm,
  sessionSaveLoading,
  setEditId,
  setDeleteId,
  setOpenReflectionGoalId,
  setOpenProgressGoalId,
  setSessionForm,
  openSessionEdit,
  closeSessionEdit,
  handleSessionSave,
  handleSessionDelete
}: GoalItemProps) {
  
  // 목표의 평균 달성률 계산
  const averagePercent = (() => {
    const goalSessions = sessions[goal.id] || [];
    if (goalSessions.length === 0) return 0;
    return Math.round(goalSessions.reduce((acc, s) => acc + s.percent, 0) / goalSessions.length);
  })();

  return (
    <Accordion key={goal.id}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`goal-${goal.id}-content`}
        id={`goal-${goal.id}-header`}
      >
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              [{goal.subject}] {goal.description}
            </Typography>
            <Box>
              <IconButton size="small" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditId(goal); }}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(goal.id); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={averagePercent} 
              sx={{ flexGrow: 1, height: 8, borderRadius: 5 }} 
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2, minWidth: "45px" }}>
              {averagePercent}%
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => { e.stopPropagation(); setOpenReflectionGoalId(goal.id); }}
            >
              전체 반성 보기
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => { e.stopPropagation(); setOpenProgressGoalId(goal.id); }}
            >
              달성률 차트
            </Button>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="h6" fontWeight={600} mb={2}>학습 세션 기록</Typography>
        {sessionLoading[goal.id] ? <CircularProgress size={24} /> : (
          <Grid container spacing={2}>
            {[1,2,3].map(sessionNo => {
              const session = sessions[goal.id]?.find(s => s.session_no === sessionNo);
              const isEditing = Boolean(sessionEdit && sessionEdit.goalId === goal.id && sessionEdit.sessionNo === sessionNo);
              
              return (
                <SessionCard
                  key={sessionNo}
                  goalId={goal.id}
                  sessionNo={sessionNo}
                  session={session}
                  isEditing={isEditing}
                  sessionForm={sessionForm}
                  sessionSaveLoading={sessionSaveLoading}
                  setSessionForm={setSessionForm}
                  openSessionEdit={openSessionEdit}
                  closeSessionEdit={closeSessionEdit}
                  handleSessionSave={handleSessionSave}
                  handleSessionDelete={handleSessionDelete}
                />
              );
            })}
          </Grid>
        )}
        {goal?.id && sessionError[goal.id] && <Typography color="error">{sessionError[goal.id]}</Typography>}
      </AccordionDetails>
    </Accordion>
  );
}
