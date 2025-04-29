import React from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText, Avatar, Box, Chip
} from '@mui/material';
import { User } from '../types';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // 아이콘 추가

interface StudentLeaderboardProps {
  students: User[];
  studentStats: Record<string, {
    avgPercent: number;
    sessionCount: number;
    reflectionRate: number;
  }>;
  topN?: number; // 상위 몇 명을 보여줄지 (기본값 5)
}

// 점수 계산 함수 (가중치 적용)
const calculateScore = (stats: {
  avgPercent: number;
  sessionCount: number;
  reflectionRate: number;
}): number => {
  const { avgPercent = 0, sessionCount = 0, reflectionRate = 0 } = stats || {};
  // 예시 가중치: 달성률 50%, 세션수 30%, 반성률 20%
  const score = (avgPercent * 0.5) + (sessionCount * 0.3) + (reflectionRate * 0.2);
  return Math.round(score * 10) / 10; // 소수점 한 자리까지
};

const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({ students, studentStats, topN = 5 }) => {
  const rankedStudents = students
    .map(student => ({
      ...student,
      stats: studentStats[student.user_id] || { avgPercent: 0, sessionCount: 0, reflectionRate: 0 },
      score: calculateScore(studentStats[student.user_id])
    }))
    .filter(s => s.score > 0) // 점수가 0보다 큰 학생만 포함
    .sort((a, b) => b.score - a.score) // 점수 내림차순 정렬
    .slice(0, topN); // 상위 N명 선택

  if (rankedStudents.length === 0) {
    return null; // 리더보드에 표시할 학생이 없으면 렌더링하지 않음
  }

  // 순위에 따른 아이콘 색상
  const getRankColor = (rank: number) => {
    if (rank === 0) return '#FFD700'; // 금색
    if (rank === 1) return '#C0C0C0'; // 은색
    if (rank === 2) return '#CD7F32'; // 동색
    return 'inherit'; // 그 외
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>리더보드 (Top {topN})</Typography>
      <List dense>
        {rankedStudents.map((student, index) => (
          <ListItem key={student.user_id} sx={{ py: 1.5 }}>
            <Avatar sx={{ bgcolor: getRankColor(index), mr: 2 }}>
              <EmojiEventsIcon />
            </Avatar>
            <ListItemText
              primary={<Typography variant="subtitle1">{index + 1}. {student.name} {student.school && <span style={{ fontSize: '0.85em', color: '#555' }}>({student.school})</span>}</Typography>}
              secondary={`점수: ${student.score}점 | 달성률: ${student.stats.avgPercent}% | 세션: ${student.stats.sessionCount}회 | 반성률: ${student.stats.reflectionRate}%`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default StudentLeaderboard; 