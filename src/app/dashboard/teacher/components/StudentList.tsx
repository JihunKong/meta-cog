import React from 'react';
import { Box, Typography, Card, CardContent, ListItem, List, Button, CircularProgress } from '@mui/material';
import { User } from '../types';

interface StudentListProps {
  students: User[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onStudentClick: (student: User) => void;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  loading,
  error,
  onRefresh,
  onStudentClick
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={onRefresh} sx={{ mt: 2 }}>
          다시 시도
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        학생 목록
      </Typography>
      
      {students.length === 0 ? (
        <Typography>등록된 학생이 없습니다.</Typography>
      ) : (
        <List>
          {students.map((student) => (
            <ListItem key={student.user_id} disablePadding>
              <Card sx={{ width: '100%', mb: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{student.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{student.email}</Typography>
                    </Box>
                    <Button variant="contained" onClick={() => onStudentClick(student)}>
                      목표 보기
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

export default StudentList;
