import React from 'react';
import { Box, Typography } from '@mui/material';
import { User } from '../types';
import StudentCard from './StudentCard';

interface StudentListGridProps {
  students: User[];
  studentStats: Record<string, any>;
  search: string;
  onViewDetails: (student: User) => void;
}

const StudentListGrid: React.FC<StudentListGridProps> = ({ students, studentStats, search, onViewDetails }) => {
  const filteredStudents = students.filter(s =>
    search.trim() === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (filteredStudents.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
        <Typography>학생이 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {filteredStudents.map(student => (
        <StudentCard
          key={student.user_id}
          student={student}
          stats={studentStats[student.user_id] || { avgPercent: 0, sessionCount: 0, reflectionRate: 0 }}
          onViewDetails={onViewDetails}
        />
      ))}
    </Box>
  );
};

export default StudentListGrid; 