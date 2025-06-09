import React from 'react';
import { Box, Typography, Card, CardContent, ListItem, List, Button, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Goal, Session, Reflection } from '../types';

interface GoalDetailsProps {
  goal: Goal | null;
  sessions: Session[];
  reflections: Reflection[];
  loading: boolean;
  error: string | null;
  open: boolean;
  onClose: () => void;
  onFeedbackClick: (reflection: Reflection) => void;
}

const GoalDetails: React.FC<GoalDetailsProps> = ({
  goal,
  sessions,
  reflections,
  loading,
  error,
  open,
  onClose,
  onFeedbackClick
}) => {
  if (!open) return null;

  return (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: { xs: '90%', sm: '80%', md: '70%' },
      maxWidth: 800,
      maxHeight: '90vh',
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      borderRadius: 2,
      overflow: 'auto'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {goal?.title}
        </Typography>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ my: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            세션 목록
          </Typography>
          
          {sessions.length === 0 ? (
            <Typography>등록된 세션이 없습니다.</Typography>
          ) : (
            <List>
              {sessions.map((session) => (
                <ListItem key={session.id} disablePadding>
                  <Card sx={{ width: '100%', mb: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {session.date && session.date.toDate ? new Date(session.date.toDate()).toLocaleDateString() : '날짜 없음'} 
                        - {session.duration}분
                      </Typography>
                      <Typography variant="body2">{session.notes}</Typography>
                    </CardContent>
                  </Card>
                </ListItem>
              ))}
            </List>
          )}
          
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            리플렉션 목록
          </Typography>
          
          {reflections.length === 0 ? (
            <Typography>등록된 리플렉션이 없습니다.</Typography>
          ) : (
            <List>
              {reflections.map((reflection) => (
                <ListItem key={reflection.id} disablePadding>
                  <Card sx={{ width: '100%', mb: 2 }}>
                    <CardContent>
                      <Typography variant="body1">{reflection.content}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reflection.created_at && reflection.created_at.toDate ? new Date(reflection.created_at.toDate()).toLocaleString() : '날짜 없음'}
                      </Typography>
                      
                      {reflection.teacher_feedback && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                          <Typography variant="subtitle2">교사 피드백:</Typography>
                          <Typography variant="body2">{reflection.teacher_feedback}</Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => onFeedbackClick(reflection)}
                          sx={{ mr: 1 }}
                        >
                          {reflection.teacher_feedback ? '피드백 수정' : '피드백 남기기'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
};

export default GoalDetails;
