import React from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText, Avatar, Box, Chip, Tooltip
} from '@mui/material';
import { User } from '../types';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { calculateImprovedScore } from '@/lib/leaderboard-scoring';

interface StudentLeaderboardProps {
  students: User[];
  studentStats: Record<string, {
    avgPercent: number;
    sessionCount: number;
    reflectionRate: number;
    sessions: any[];
  }>;
  topN?: number;
}

// 개선된 점수 계산 시스템 (라이브러리 함수 사용)
const calculateStudentScore = (stats: {
  avgPercent: number;
  sessionCount: number; 
  reflectionRate: number;
  sessions: any[];
}) => {
  const { sessions = [] } = stats;
  return calculateImprovedScore(sessions);
};


const ImprovedStudentLeaderboard: React.FC<StudentLeaderboardProps> = ({ 
  students, 
  studentStats, 
  topN = 5 
}) => {
  const rankedStudents = students
    .map(student => {
      const stats = studentStats[student.user_id] || { 
        avgPercent: 0, 
        sessionCount: 0, 
        reflectionRate: 0, 
        sessions: [] 
      };
      const scoreData = calculateStudentScore(stats);
      
      return {
        ...student,
        stats,
        scoreData
      };
    })
    .filter(s => s.scoreData.score > 0)
    .sort((a, b) => b.scoreData.score - a.scoreData.score)
    .slice(0, topN);

  if (rankedStudents.length === 0) {
    return null;
  }

  const getRankColor = (rank: number) => {
    if (rank === 0) return '#FFD700';
    if (rank === 1) return '#C0C0C0'; 
    if (rank === 2) return '#CD7F32';
    return 'inherit';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <EmojiEventsIcon />;
    if (rank === 1) return <LocalFireDepartmentIcon />;
    if (rank === 2) return <MenuBookIcon />;
    return <CalendarTodayIcon />;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        학습 리더보드 (개선된 공정 점수 시스템)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        일관성(40%) + 반성품질(35%) + 적정참여(15%) + 연속학습(10%)
      </Typography>
      
      <List dense>
        {rankedStudents.map((student, index) => (
          <ListItem key={student.user_id} sx={{ py: 1.5 }}>
            <Avatar sx={{ bgcolor: getRankColor(index), mr: 2 }}>
              {getRankIcon(index)}
            </Avatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">
                    {index + 1}. {student.name}
                  </Typography>
                  {student.school && (
                    <Typography variant="caption" color="text.secondary">
                      ({student.school})
                    </Typography>
                  )}
                  <Chip 
                    label={`${student.scoreData.score}점`} 
                    size="small" 
                    color="primary"
                  />
                </Box>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Tooltip title="학습 일관성">
                      <Chip 
                        label={`일관성 ${student.scoreData.breakdown.consistency}`}
                        size="small"
                        variant="outlined"
                        color="success"
                      />
                    </Tooltip>
                    <Tooltip title="반성 품질">
                      <Chip 
                        label={`품질 ${student.scoreData.breakdown.quality}`}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    </Tooltip>
                    <Tooltip title="적정 참여도">
                      <Chip 
                        label={`참여 ${student.scoreData.breakdown.engagement}`}
                        size="small"
                        variant="outlined"
                        color="warning"
                      />
                    </Tooltip>
                    <Tooltip title="연속 학습 보너스">
                      <Chip 
                        label={`연속 ${student.scoreData.breakdown.streak}`}
                        size="small"
                        variant="outlined"
                        color="error"
                      />
                    </Tooltip>
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          💡 공정한 평가 기준: 성취도는 점수에 반영되지 않으며, 하루 최대 3세션만 인정됩니다. 
          꾸준한 학습과 성의있는 반성이 높은 점수를 받습니다.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ImprovedStudentLeaderboard;