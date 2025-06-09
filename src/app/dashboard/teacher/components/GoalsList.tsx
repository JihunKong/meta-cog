import React from 'react';
import { Box, Typography, Card, CardContent, ListItem, List, Button, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Goal, User } from '../types';

interface GoalsListProps {
  student: User | null;
  goals: Goal[];
  loading: boolean;
  error: string | null;
  open: boolean;
  onClose: () => void;
  onGoalClick: (goal: Goal) => void;
}

const GoalsList: React.FC<GoalsListProps> = ({
  student,
  goals,
  loading,
  error,
  open,
  onClose,
  onGoalClick
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
          {student?.name}의 목표
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
      ) : goals.length === 0 ? (
        <Typography>등록된 목표가 없습니다.</Typography>
      ) : (
        <List>
          {goals.map((goal) => (
            <ListItem key={goal.id} disablePadding>
              <Card sx={{ width: '100%', mb: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{goal.title}</Typography>
                      <Typography variant="body2">{goal.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        생성일: {goal.created_at && goal.created_at.toDate ? new Date(goal.created_at.toDate()).toLocaleDateString() : '날짜 없음'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        상태: {goal.status === 'active' ? '진행 중' : '완료'}
                      </Typography>
                    </Box>
                    <Button variant="contained" onClick={() => onGoalClick(goal)}>
                      세부 정보
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default GoalsList;
