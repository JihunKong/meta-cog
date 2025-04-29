import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Box } from '@mui/material';
import { Session } from '../types';

interface FeedbackDialogProps {
  open: boolean;
  session: Session | null;
  feedbackText: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onFeedbackChange: (value: string) => void;
  onSave: () => void;
}

const formatFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return '-';
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return new Date(timestamp.toDate()).toLocaleString();
    }
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleString();
    if (typeof timestamp === 'number') return new Date(timestamp).toLocaleString();
    return '-';
  } catch { return '-'; }
};

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  session,
  feedbackText,
  loading,
  error,
  onClose,
  onFeedbackChange,
  onSave
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>학습 세션 피드백</DialogTitle>
      <DialogContent dividers>
        {session && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              {formatFirestoreTimestamp(session.created_at)} / {session.subject || '과목 없음'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              {session.notes || '세션 내용 없음'}
            </Typography>
            {session.reflection && (
              <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                학생 반성: {session.reflection}
              </Typography>
            )}
          </Box>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="교사 피드백"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={feedbackText}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="피드백을 입력하세요..."
        />
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? '저장 중...' : '피드백 저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog;
