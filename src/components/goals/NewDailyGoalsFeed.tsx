import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, TextField, Button, Card, CardContent,
  Avatar, Chip, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemAvatar, ListItemText, Divider,
  Alert, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NewDailyGoalsFeedProps {
  currentUserId: string;
  userRole: string;
}

interface DailyGoal {
  id: string;
  userId: string;
  content: string;
  author: {
    id: string;
    name: string;
    school?: string;
  };
  supportCount: number;
  commentCount: number;
  createdAt: Date;
  isSupported?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  content: string;
  author: {
    name: string;
    school?: string;
  };
  createdAt: Date;
}

const NewDailyGoalsFeed: React.FC<NewDailyGoalsFeedProps> = ({ currentUserId, userRole }) => {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // 입력 상태
  const [goalInput, setGoalInput] = useState('');
  
  // 댓글 상태
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // 메뉴 상태
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGoalForMenu, setSelectedGoalForMenu] = useState<DailyGoal | null>(null);

  // 목표 목록 로드
  const loadGoals = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/daily-goals?userId=${currentUserId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '목표를 불러오는 중 오류가 발생했습니다.');
      }

      const goalsList = data.goals.map((goal: any) => ({
        ...goal,
        createdAt: new Date(goal.createdAt)
      }));

      setGoals(goalsList);

    } catch (err: any) {
      setError(err.message);
      console.error('목표 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 목표 선언
  const handleSubmitGoal = async () => {
    if (!goalInput.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/daily-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: goalInput.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '목표 선언 중 오류가 발생했습니다.');
      }

      setGoalInput('');
      loadGoals(); // 목록 새로고침

    } catch (error: any) {
      console.error('목표 선언 실패:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmitGoal();
    }
  };

  useEffect(() => {
    loadGoals();
  }, [currentUserId]);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* 확실한 구분을 위한 큰 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white', p: 3, borderRadius: 2 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
          ✨ NEW 목표 선언 광장 ✨
        </Typography>
        <Typography variant="h6" color="inherit">
          새로운 일일 목표 선언 시스템이 적용되었습니다!
        </Typography>
        <Typography variant="body1" color="inherit" sx={{ mt: 1 }}>
          간단하게 오늘의 목표를 선언하고 친구들과 응원하세요!
        </Typography>
      </Box>

      {/* 목표 입력 폼 */}
      <Paper sx={{ p: 3, mb: 4, border: '2px solid', borderColor: 'success.main' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
          🎯 오늘의 목표 선언하기
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="오늘의 목표를 간단히 적어보세요! (예: 수학 문제집 20문제 풀기, 영어 단어 50개 암기)"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={submitting}
            sx={{ flex: 1 }}
            variant="outlined"
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSubmitGoal}
            disabled={!goalInput.trim() || submitting}
            sx={{ minWidth: 120, height: 56 }}
            size="large"
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : '선언하기'}
          </Button>
        </Box>
      </Paper>

      {/* 성공 메시지 */}
      <Alert severity="success" sx={{ mb: 3 }}>
        🎉 새로운 DailyGoalsFeed 컴포넌트가 성공적으로 로딩되었습니다! 
        기존의 복잡한 폼이 아닌 간단한 목표 선언 형태로 변경되었습니다.
      </Alert>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 목표 목록 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={60} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            목표들을 불러오는 중...
          </Typography>
        </Box>
      ) : goals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            🌟 아직 선언된 목표가 없어요
          </Typography>
          <Typography variant="body2" color="text.secondary">
            첫 번째 목표를 선언해보세요!
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
            📋 선언된 목표들 ({goals.length}개)
          </Typography>
          {goals.map((goal) => (
            <Card key={goal.id} sx={{ mb: 3, border: '1px solid', borderColor: 'primary.light' }}>
              <CardContent>
                {/* 헤더 */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {goal.author.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {goal.author.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {goal.author.school && `${goal.author.school} • `}
                        {formatDistanceToNow(goal.createdAt, { addSuffix: true, locale: ko })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 목표 내용 */}
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                  🎯 {goal.content}
                </Typography>

                {/* 액션 버튼들 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={goal.isSupported ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    color={goal.isSupported ? "error" : "inherit"}
                    variant={goal.isSupported ? "contained" : "outlined"}
                  >
                    응원 {goal.supportCount > 0 && goal.supportCount}
                  </Button>
                  
                  <Button
                    size="small"
                    startIcon={<CommentIcon />}
                    variant="outlined"
                  >
                    댓글 {goal.commentCount > 0 && goal.commentCount}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default NewDailyGoalsFeed;