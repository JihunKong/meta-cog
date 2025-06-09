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

interface DailyGoalsFeedProps {
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

const DailyGoalsFeed: React.FC<DailyGoalsFeedProps> = ({ currentUserId, userRole }) => {
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

  // 응원하기
  const handleSupport = async (goalId: string) => {
    try {
      const response = await fetch('/api/daily-goals/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          userId: currentUserId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '응원 중 오류가 발생했습니다.');
      }

      // 로컬 상태 업데이트
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { 
              ...goal, 
              supportCount: goal.isSupported ? goal.supportCount - 1 : goal.supportCount + 1,
              isSupported: !goal.isSupported
            }
          : goal
      ));

    } catch (error: any) {
      console.error('응원 실패:', error);
      setError(error.message);
    }
  };

  // 댓글 로드
  const loadComments = async (goalId: string) => {
    try {
      const response = await fetch(`/api/daily-goals/${goalId}/comments`);
      const data = await response.json();

      if (response.ok) {
        const commentsList = data.comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        }));
        setComments(commentsList);
      }
    } catch (error) {
      console.error('댓글 로딩 실패:', error);
    }
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedGoal) return;

    try {
      const response = await fetch(`/api/daily-goals/${selectedGoal.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: newComment.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '댓글 작성 중 오류가 발생했습니다.');
      }

      setNewComment('');
      loadComments(selectedGoal.id);
      
      // 댓글 수 업데이트
      setGoals(prev => prev.map(goal => 
        goal.id === selectedGoal.id 
          ? { ...goal, commentCount: goal.commentCount + 1 }
          : goal
      ));

    } catch (error: any) {
      console.error('댓글 작성 실패:', error);
    }
  };

  // 목표 삭제
  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/daily-goals/${goalId}?userId=${currentUserId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제 중 오류가 발생했습니다.');
      }

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      setMenuAnchorEl(null);
      setSelectedGoalForMenu(null);

    } catch (error: any) {
      console.error('삭제 실패:', error);
      setError(error.message);
    }
  };

  // 댓글 다이얼로그 열기
  const openCommentsDialog = (goal: DailyGoal) => {
    setSelectedGoal(goal);
    setCommentsDialogOpen(true);
    loadComments(goal.id);
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
      {/* 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          🎯 목표 선언 광장
        </Typography>
        <Typography variant="body1" color="text.secondary">
          오늘의 목표를 선언하고 친구들과 함께 응원해요!
        </Typography>
      </Box>

      {/* 목표 입력 폼 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="오늘의 목표를 선언해보세요! (예: 수학 문제집 20문제 풀기, 영어 단어 50개 암기)"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={submitting}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSubmitGoal}
            disabled={!goalInput.trim() || submitting}
            sx={{ minWidth: 100 }}
          >
            {submitting ? <CircularProgress size={20} /> : '선언'}
          </Button>
        </Box>
      </Paper>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 목표 목록 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            목표들을 불러오는 중...
          </Typography>
        </Box>
      ) : goals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            아직 선언된 목표가 없어요
          </Typography>
          <Typography variant="body2" color="text.secondary">
            첫 번째 목표를 선언해보세요!
          </Typography>
        </Paper>
      ) : (
        <Box>
          {goals.map((goal) => (
            <Card key={goal.id} sx={{ mb: 3 }}>
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
                  
                  {/* 메뉴 버튼 (본인 목표만) */}
                  {goal.author.id === currentUserId && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchorEl(e.currentTarget);
                        setSelectedGoalForMenu(goal);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </Box>

                {/* 목표 내용 */}
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {goal.content}
                </Typography>

                {/* 액션 버튼들 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={goal.isSupported ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    onClick={() => handleSupport(goal.id)}
                    color={goal.isSupported ? "error" : "inherit"}
                  >
                    {goal.supportCount > 0 ? goal.supportCount : '응원'}
                  </Button>
                  
                  <Button
                    size="small"
                    startIcon={<CommentIcon />}
                    onClick={() => openCommentsDialog(goal)}
                  >
                    {goal.commentCount > 0 ? goal.commentCount : '댓글'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 메뉴 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => {
          setMenuAnchorEl(null);
          setSelectedGoalForMenu(null);
        }}
      >
        <MenuItem onClick={() => {
          if (selectedGoalForMenu) {
            handleDeleteGoal(selectedGoalForMenu.id);
          }
        }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          삭제하기
        </MenuItem>
      </Menu>

      {/* 댓글 다이얼로그 */}
      <Dialog 
        open={commentsDialogOpen} 
        onClose={() => setCommentsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          💬 댓글
          {selectedGoal && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedGoal.author.name}의 목표
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {/* 목표 내용 */}
          {selectedGoal && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="body2">
                {selectedGoal.content}
              </Typography>
            </Paper>
          )}

          {/* 댓글 목록 */}
          <List>
            {comments.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="아직 댓글이 없어요"
                  secondary="첫 번째 댓글을 남겨보세요!"
                />
              </ListItem>
            ) : (
              comments.map((comment, index) => (
                <React.Fragment key={comment.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        {comment.author.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {comment.author.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: ko })}
                          </Typography>
                        </Box>
                      }
                      secondary={comment.content}
                    />
                  </ListItem>
                  {index < comments.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="응원 댓글을 남겨보세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              variant="contained"
              size="small"
            >
              작성
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DailyGoalsFeed;