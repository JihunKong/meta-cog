"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Slider, Typography, Box
} from "@mui/material";

interface Session {
  id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
}

interface SessionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    subject: string;
    description: string;
    percent: string;
    reflection: string;
  }) => void;
  session: Session | null;
  loading: boolean;
}

const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function SessionDialog({
  open,
  onClose,
  onSave,
  session,
  loading
}: SessionDialogProps) {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    percent: "0",
    reflection: ""
  });

  // 세션 데이터로 폼 초기화
  useEffect(() => {
    if (session) {
      setFormData({
        subject: session.subject,
        description: session.description,
        percent: session.percent ? session.percent.toString() : "0",
        reflection: session.reflection || ""
      });
    } else {
      setFormData({
        subject: SUBJECTS[0],
        description: "",
        percent: "0",
        reflection: ""
      });
    }
  }, [session, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    setFormData(prev => ({ ...prev, subject: e.target.value }));
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setFormData(prev => ({ ...prev, percent: (newValue as number).toString() }));
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      percent: parseInt(formData.percent) || 0,
      reflection: formData.reflection
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{session ? "세션 수정" : "새 학습 세션 추가"}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel id="subject-label">과목</InputLabel>
          <Select
            labelId="subject-label"
            value={formData.subject}
            onChange={handleSelectChange}
            label="과목"
            name="subject"
          >
            {SUBJECTS.map(subject => (
              <MenuItem key={subject} value={subject}>{subject}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          margin="normal"
          label="학습 내용"
          name="description"
          fullWidth
          multiline
          rows={4}
          value={formData.description}
          onChange={handleChange}
        />

        {session && (
          <>
            <Box sx={{ mt: 3, mb: 1 }}>
              <Typography id="percent-slider" gutterBottom>
                달성도: {formData.percent}%
              </Typography>
              <Slider
                value={parseInt(formData.percent) || 0}
                onChange={handleSliderChange}
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
              name="reflection"
              fullWidth
              multiline
              rows={4}
              value={formData.reflection}
              onChange={handleChange}
              placeholder="이번 학습에서 어려웠던 점과 개선할 점을 적어보세요."
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>취소</Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained" 
          disabled={loading || !formData.subject || !formData.description}
        >
          {loading ? <CircularProgress size={24} /> : (session ? "저장" : "추가")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
