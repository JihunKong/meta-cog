import React from 'react';
import {
  Modal, Box, Typography, IconButton, List, ListItem, ListItemText, Button, Divider, Paper, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { User, Session } from '../types';

interface StudentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  student: User | null;
  studentStats: {
    sessions?: Session[];
    goals?: any[]; // 목표 데이터 타입은 임시로 any
  };
  onOpenFeedbackDialog: (session: Session) => void;
}

// Firestore 타임스탬프 포맷팅 함수 (TeacherDashboard에서 복사 또는 공유)
const formatFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return '날짜 없음';
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return new Date(timestamp.toDate()).toLocaleString();
    }
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleString();
    if (typeof timestamp === 'number') return new Date(timestamp).toLocaleString();
    return '날짜 형식 오류';
  } catch (error) {
    console.error('날짜 변환 오류:', error);
    return '날짜 변환 오류';
  }
};

// 안전한 날짜 비교 함수
const getTimestampValue = (timestamp: any): number => {
  if (!timestamp) return 0;
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().getTime();
    }
    if (timestamp instanceof Date) return timestamp.getTime();
    if (typeof timestamp === 'string') return new Date(timestamp).getTime();
    if (typeof timestamp === 'number') return timestamp;
    return 0;
  } catch (error) {
    console.error('타임스탬프 변환 오류:', error);
    return 0;
  }
};

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  open,
  onClose,
  student,
  studentStats,
  onOpenFeedbackDialog
}) => {
  if (!student) return null;

  const sessions = studentStats?.sessions || [];

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="student-details-modal">
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: '85%', md: '75%' },
        maxWidth: 900,
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        overflowY: 'auto'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" id="student-details-modal">{student.name} {student.school && <span style={{ fontSize: '0.8em', color: '#555' }}>({student.school})</span>} 학생 세부 정보</Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 학생 기본 정보 섹션 */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>학생 정보</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ minWidth: '200px' }}>
              <Typography variant="body2" color="text.secondary">이메일</Typography>
              <Typography variant="body1">{student.email}</Typography>
            </Box>
            <Box sx={{ minWidth: '150px' }}>
              <Typography variant="body2" color="text.secondary">학교</Typography>
              <Typography variant="body1">{student.school || '-'}</Typography>
            </Box>
            <Box sx={{ minWidth: '100px' }}>
              <Typography variant="body2" color="text.secondary">학년</Typography>
              <Typography variant="body1">{student.grade || '-'}</Typography>
            </Box>
            <Box sx={{ minWidth: '100px' }}>
              <Typography variant="body2" color="text.secondary">반</Typography>
              <Typography variant="body1">{student.classNum || '-'}</Typography>
            </Box>
            <Box sx={{ minWidth: '100px' }}>
              <Typography variant="body2" color="text.secondary">번호</Typography>
              <Typography variant="body1">{student.studentNum || '-'}</Typography>
            </Box>
          </Box>
        </Paper>

        <Typography variant="h6" sx={{ mb: 1 }}>학습 세션 ({sessions.length}개)</Typography>
        {sessions.length > 0 ? (
          <Paper variant="outlined" sx={{ maxHeight: 400, overflowY: 'auto' }}>
            <List dense>
              {sessions.sort((a, b) => getTimestampValue(b.created_at) - getTimestampValue(a.created_at)).map((session, index) => (
                <React.Fragment key={session.id || index}>
                  <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2 }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {session.subject || '과목 없음'} ({session.percent}% 집중)
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {formatFirestoreTimestamp(session.created_at)}
                          </Typography>
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {session.notes || '세부 내용 없음'}
                          </Typography>
                          {session.reflection && (
                            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                              반성: {session.reflection}
                            </Typography>
                          )}
                          {session.teacher_feedback && (
                            <Chip 
                              label={`피드백: ${session.teacher_feedback}`}
                              size="small"
                              sx={{ mt: 1, bgcolor: '#e0f7fa', color: '#00796b' }}
                            />
                          )}
                        </>
                      }
                    />
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => onOpenFeedbackDialog(session)}
                      sx={{ ml: 2, flexShrink: 0 }}
                    >
                      {session.teacher_feedback ? '피드백 수정' : '피드백 추가'}
                    </Button>
                  </ListItem>
                  {index < sessions.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ) : (
          <Typography sx={{ p: 2, color: 'text.secondary' }}>기록된 학습 세션이 없습니다.</Typography>
        )}

        {/* 필요시 목표(goals) 목록 등 추가 가능 */}

      </Box>
    </Modal>
  );
};

export default StudentDetailsModal; 