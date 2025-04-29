import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { User } from '../types';

interface StudentCardProps {
  student: User;
  stats: {
    avgPercent: number;
    sessionCount: number;
    reflectionRate: number;
  };
  onViewDetails: (student: User) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, stats, onViewDetails }) => {
  return (
    <Card sx={{ minWidth: 280, maxWidth: 340, flex: '1 1 320px', p: 2 }}>
      <CardContent>
        <Typography variant="h6">{student.name} {student.school && <span style={{ fontSize: '0.8em', color: '#555' }}>({student.school})</span>}</Typography>
        <Typography variant="body2" color="text.secondary">{student.email}</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>평균 달성률: <b>{stats.avgPercent ?? '-'}%</b></Typography>
          <Typography>세션 수: <b>{stats.sessionCount ?? '-'}</b></Typography>
          <Typography>반성 작성률: <b>{stats.reflectionRate ?? '-'}%</b></Typography>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => onViewDetails(student)}
          >
            세부 정보 보기
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StudentCard; 