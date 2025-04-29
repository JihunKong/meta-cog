"use client";

import { useState } from "react";
import {
  Box, Typography, Button, Card, CardContent, CardActions, TextField,
  Chip, IconButton, LinearProgress, MenuItem
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FeedIcon from '@mui/icons-material/Feed';

interface Session {
  id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
  teacher_feedback?: string;
}

interface SessionItemProps {
  session: Session;
  isEditing: boolean;
  openEdit: (sessionId: string) => void;
  closeEdit: () => void;
  handleSave: (sessionId: string, data: {
    subject: string;
    description: string;
    percent: string;
    reflection: string;
  }) => void;
  handleDelete: (sessionId: string) => void;
  saveLoading: boolean;
}

const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function SessionItem({
  session,
  isEditing,
  openEdit,
  closeEdit,
  handleSave,
  handleDelete,
  saveLoading
}: SessionItemProps) {
  const [formData, setFormData] = useState({
    subject: session.subject,
    description: session.description,
    percent: session.percent ? session.percent.toString() : "0",
    reflection: session.reflection || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(session.id, {
      ...formData,
      percent: formData.percent || '0',
      reflection: formData.reflection
    });
  };

  const formattedDate = new Date(session.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).replace(/\. /g, "-").replace(".", "");

  return (
    <Card 
      variant="outlined" 
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderWidth: session.percent >= 70 ? 2 : 1,
        borderColor: session.percent >= 70 ? "primary.main" : "#e0e0e0",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 3
        }
      }}
    >
      <Box 
        sx={{
          bgcolor: session.percent >= 70 ? 'primary.light' : '#f5f5f5',
          color: session.percent >= 70 ? 'primary.contrastText' : 'inherit',
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {formattedDate}
          </Typography>
          <Chip 
            label={session.subject} 
            size="small" 
            color={session.percent >= 70 ? 'default' : 'primary'}
            variant="outlined"
            sx={{ mr: 1, mt: 0.5, bgcolor: session.percent >= 70 ? 'white' : 'transparent'}}
          />
        </Box>
        
        {session.percent > 0 && (
          <Chip 
            label={`${session.percent}% 달성`} 
            color={session.percent >= 70 ? 'success' : 'primary'}
            size="small" 
            variant={session.percent >= 70 ? "filled" : "outlined"} 
          />
        )}
        
        {!isEditing && (
          <Box>
            <IconButton size="small" onClick={() => openEdit(session.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(session.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {isEditing ? (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label="과목"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              margin="normal"
              size="small"
              required
            >
              {SUBJECTS.map(subject => (
                <MenuItem key={subject} value={subject}>{subject}</MenuItem>
              ))}
            </TextField>
            
            <TextField
              fullWidth
              label="학습 목표"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              size="small"
              multiline
              rows={2}
              required
              placeholder="오늘의 학습 목표를 입력하세요"
              helperText="구체적이고 측정 가능한 목표를 설정하세요"
            />
            
            <TextField
              fullWidth
              label="달성도 (%)"
              name="percent"
              type="number"
              value={formData.percent}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100 }}
              margin="normal"
              size="small"
              required
              helperText="0~100 사이의 숫자를 입력하세요"
            />
            
            <TextField
              fullWidth
              label="학습 반성"
              name="reflection"
              value={formData.reflection}
              onChange={handleChange}
              margin="normal"
              size="small"
              multiline
              rows={3}
              placeholder="오늘의 학습을 돌아보며 느낀 점을 적어주세요..."
            />
            
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={closeEdit} sx={{ mr: 1 }}>취소</Button>
              <Button type="submit" variant="contained" disabled={saveLoading}>
                {saveLoading ? "저장 중..." : "저장"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              {session.description}
            </Typography>
            {session.reflection && (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 1.5 }}>
                <Chip label="나의 반성" size="small" sx={{ mr: 0.5 }} /> {session.reflection}
              </Typography>
            )}
            {session.teacher_feedback && (
              <Box sx={{ 
                p: 1.5, 
                bgcolor: '#fff9c4',
                borderRadius: 1, 
                display: 'flex', 
                alignItems: 'center'
              }}>
                <FeedIcon fontSize="small" sx={{ mr: 1, color: '#fbc02d' }} />
                <Typography variant="body2" sx={{ color: '#795548' }}>
                  {session.teacher_feedback}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      {!isEditing && (
        <CardActions sx={{ borderTop: "1px solid #f0f0f0", pt: 1, pb: 1 }}>
          <Button
            size="small" 
            startIcon={<EditIcon />}
            onClick={() => openEdit(session.id)}
          >
            {session.percent > 0 ? "수정" : "완료 기록"}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
