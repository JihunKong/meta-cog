import React from 'react';
import { Paper, Typography, Grid, Box } from '@mui/material';
import { User } from '../types';

interface StudentStatsSummaryProps {
  students: User[];
  studentStats: Record<string, {
    avgPercent: number;
    sessionCount: number;
    reflectionRate: number;
  }>;
}

const StudentStatsSummary: React.FC<StudentStatsSummaryProps> = ({ students, studentStats }) => {
  const totalStudents = students.length;
  let totalAvgPercent = 0;
  let totalSessionCount = 0;
  let totalReflectionRate = 0;

  if (totalStudents > 0) {
    let sumAvgPercent = 0;
    let sumSessionCount = 0;
    let sumReflectionRate = 0;
    
    students.forEach(student => {
      const stats = studentStats[student.user_id];
      if (stats) {
        sumAvgPercent += stats.avgPercent || 0;
        sumSessionCount += stats.sessionCount || 0;
        sumReflectionRate += stats.reflectionRate || 0;
      }
    });

    totalAvgPercent = Math.round(sumAvgPercent / totalStudents);
    totalSessionCount = Math.round(sumSessionCount / totalStudents);
    totalReflectionRate = Math.round(sumReflectionRate / totalStudents);
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>전체 학생 통계 요약</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="h5">{totalStudents}</Typography>
            <Typography color="text.secondary">총 학생 수</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="h5">{totalAvgPercent}%</Typography>
            <Typography color="text.secondary">평균 달성률</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="h5">{totalSessionCount}</Typography>
            <Typography color="text.secondary">평균 세션 수</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="h5">{totalReflectionRate}%</Typography>
            <Typography color="text.secondary">평균 반성률</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StudentStatsSummary; 