import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, TextField, Button, Card, CardContent,
  Avatar, Alert, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
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
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  

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
      console.log('댓글 로딩 시작:', goalId);
      const response = await fetch(`/api/daily-goals/${goalId}/comments`);
      const data = await response.json();
      
      console.log('댓글 API 응답:', response.status, data);

      if (response.ok && data.success) {
        const commentsList = data.comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        }));
        console.log('처리된 댓글 목록:', commentsList);
        setComments(prev => ({
          ...prev,
          [goalId]: commentsList
        }));
      } else {
        console.log('댓글 로딩 실패 또는 빈 결과:', data);
        setComments(prev => ({
          ...prev,
          [goalId]: []
        }));
      }
    } catch (error) {
      console.error('댓글 로딩 실패:', error);
      setComments(prev => ({
        ...prev,
        [goalId]: []
      }));
    }
  };

  // 댓글 작성
  const handleSubmitComment = async (goalId: string) => {
    if (!newComment.trim()) return;

    try {
      console.log('댓글 작성 시작:', goalId, newComment.trim());
      const response = await fetch(`/api/daily-goals/${goalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: newComment.trim()
        })
      });

      const result = await response.json();
      console.log('댓글 작성 응답:', response.status, result);

      if (!response.ok) {
        throw new Error(result.error || '댓글 작성 중 오류가 발생했습니다.');
      }

      setNewComment('');
      console.log('댓글 작성 성공, 새로고침 시작...');
      // 댓글 목록 새로고침
      await loadComments(goalId);

    } catch (error: any) {
      console.error('댓글 작성 실패:', error);
      setError(error.message);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (goalId: string, commentId: string) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/daily-goals/${goalId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '댓글 삭제 중 오류가 발생했습니다.');
      }

      // 댓글 목록 새로고침
      await loadComments(goalId);
      
      // 목표 목록도 새로고침하여 댓글 수 업데이트
      await loadGoals();

    } catch (error: any) {
      console.error('댓글 삭제 실패:', error);
      setError(error.message);
    }
  };

  // 목표 삭제
  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('정말로 이 목표를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/daily-goals/${goalId}?userId=${currentUserId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '목표 삭제 중 오류가 발생했습니다.');
      }

      // 로컬 상태에서 제거
      setGoals(prev => prev.filter(goal => goal.id !== goalId));

    } catch (error: any) {
      console.error('목표 삭제 실패:', error);
      setError(error.message);
    }
  };

  // 댓글 토글
  const toggleComments = (goalId: string) => {
    console.log('댓글 토글:', goalId, '현재 expanded:', expandedGoalId);
    console.log('현재 comments 상태:', comments);
    
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
    } else {
      setExpandedGoalId(goalId);
      // 댓글이 이미 로드되어 있지 않다면 로드
      if (!comments[goalId]) {
        console.log('댓글 로딩 필요, 로딩 시작...');
        loadComments(goalId);
      } else {
        console.log('기존 댓글 사용:', comments[goalId]);
      }
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
        <Typography variant="h6" sx={{ mb: 2 }}>
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
            onKeyDown={handleKeyPress}
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
          <Typography variant="h5" sx={{ mb: 3 }}>
            📋 선언된 목표들 ({goals.length}개)
          </Typography>
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
                  {/* 삭제 버튼 (본인의 목표일 때만 표시) */}
                  {goal.userId === currentUserId && (
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => handleDeleteGoal(goal.id)}
                      sx={{ minWidth: 'auto' }}
                    >
                      삭제
                    </Button>
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
                    color={goal.isSupported ? "error" : "inherit"}
                    variant={goal.isSupported ? "contained" : "outlined"}
                    onClick={() => handleSupport(goal.id)}
                  >
                    응원 {goal.supportCount > 0 && goal.supportCount}
                  </Button>
                  
                  <Button
                    size="small"
                    startIcon={<CommentIcon />}
                    variant="outlined"
                    onClick={() => toggleComments(goal.id)}
                  >
                    댓글 {goal.commentCount > 0 && goal.commentCount}
                  </Button>
                </Box>

                {/* 댓글 섹션 (토글) */}
                {expandedGoalId === goal.id && (
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    {/* 디버깅 정보 */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      DEBUG - Goal ID: {goal.id}, Comments: {comments[goal.id] ? comments[goal.id].length : 'undefined'}
                    </Typography>
                    
                    {/* 댓글 목록 */}
                    <Box sx={{ mb: 2, maxHeight: 300, overflowY: 'auto' }}>
                      {comments[goal.id] && comments[goal.id].length > 0 ? (
                        comments[goal.id].map((comment) => (
                          <Box key={comment.id} sx={{ mb: 2, display: 'flex', gap: 2 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                              {comment.author.name[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {comment.author.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: ko })}
                                  </Typography>
                                </Box>
                                {comment.userId === currentUserId && (
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteComment(goal.id, comment.id)}
                                    sx={{ minWidth: 'auto', p: 0.5 }}
                                  >
                                    삭제
                                  </Button>
                                )}
                              </Box>
                              <Typography variant="body2" color="text.primary">
                                {comment.content}
                              </Typography>
                            </Box>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요!
                        </Typography>
                      )}
                    </Box>

                    {/* 댓글 작성 */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="응원 댓글을 남겨보세요..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmitComment(goal.id);
                          }
                        }}
                      />
                      <Button 
                        onClick={() => handleSubmitComment(goal.id)}
                        disabled={!newComment.trim()}
                        variant="contained"
                        size="small"
                      >
                        작성
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

    </Container>
  );
};

export default NewDailyGoalsFeed;