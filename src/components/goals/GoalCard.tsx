import React, { useState } from 'react';
import {
  Card, CardContent, CardActions, Typography, Chip, Box, Button, 
  LinearProgress, Avatar, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Tooltip, Fab, Zoom
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import ShareIcon from '@mui/icons-material/Share';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseIcon from '@mui/icons-material/Pause';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string;
    subject: string;
    targetType: string;
    targetAmount: number;
    targetUnit: string;
    targetDate: Date;
    difficulty: string;
    isPublic: boolean;
    motivation: string;
    reward: string;
    status: string;
    progress: number;
    actualAmount: number;
    author: {
      id: string;
      name: string;
      school?: string;
    };
    supports?: any[];
    supportCount: number;
    commentCount: number;
    declaredAt: Date;
    updatedAt: Date;
  };
  currentUserId: string;
  onSupport?: (goalId: string, message?: string) => Promise<void>;
  onUpdate?: (goalId: string, updateData: any) => Promise<void>;
  onComment?: (goalId: string) => void;
  isOwner?: boolean;
  compact?: boolean;
}

const SUBJECT_COLORS: Record<string, string> = {
  '국어': '#ff6b6b',
  '영어': '#4ecdc4', 
  '수학': '#45b7d1',
  '과학': '#96ceb4',
  '사회': '#ffeaa7'
};

const STATUS_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DECLARED: { label: '선언됨', color: '#6c757d', icon: <EmojiEventsIcon /> },
  IN_PROGRESS: { label: '진행중', color: '#007bff', icon: <TimerIcon /> },
  COMPLETED: { label: '완료', color: '#28a745', icon: <CheckCircleIcon /> },
  FAILED: { label: '실패', color: '#dc3545', icon: <PauseIcon /> },
  ABANDONED: { label: '포기', color: '#6c757d', icon: <PauseIcon /> }
};

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  currentUserId,
  onSupport,
  onUpdate,
  onComment,
  isOwner = false,
  compact = false
}) => {
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateAmount, setUpdateAmount] = useState(0);
  const [updateMessage, setUpdateMessage] = useState('');
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [achievementRate, setAchievementRate] = useState(100);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSupported, setIsSupported] = useState(
    goal.supports?.some(s => s.supporter?.id === currentUserId) || false
  );

  const statusInfo = STATUS_INFO[goal.status] || STATUS_INFO.DECLARED;
  const subjectColor = SUBJECT_COLORS[goal.subject] || '#6c757d';
  const isExpired = new Date() > goal.targetDate && goal.status !== 'COMPLETED';
  const daysLeft = Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const canComplete = new Date() >= goal.targetDate || goal.progress >= 100;

  const handleSupport = async () => {
    if (!onSupport) return;
    
    try {
      await onSupport(goal.id, supportMessage.trim());
      setIsSupported(true);
      setSupportDialogOpen(false);
      setSupportMessage('');
    } catch (error) {
      console.error('응원 실패:', error);
    }
  };

  const handleUpdate = async (updateType: string) => {
    if (!onUpdate) return;

    try {
      const updateData = {
        updateType,
        progressAmount: updateType === 'PROGRESS' ? updateAmount : 0,
        achievementRate: updateType === 'COMPLETE' ? achievementRate : undefined,
        message: updateMessage.trim()
      };
      
      await onUpdate(goal.id, updateData);
      setUpdateDialogOpen(false);
      setCompletionDialogOpen(false);
      setUpdateAmount(0);
      setUpdateMessage('');
      setAchievementRate(100);
    } catch (error) {
      console.error('목표 업데이트 실패:', error);
    }
  };

  const getTimeLeftDisplay = () => {
    if (goal.status === 'COMPLETED') {
      return <Chip size="small" label="완료!" color="success" />;
    }
    
    if (isExpired) {
      return <Chip size="small" label="기한 만료" color="error" />;
    }
    
    if (daysLeft === 0) {
      return <Chip size="small" label="오늘까지" color="warning" />;
    }
    
    if (daysLeft > 0) {
      return <Chip size="small" label={`${daysLeft}일 남음`} color="info" />;
    }
    
    return <Chip size="small" label="기한 지남" color="error" />;
  };

  if (compact) {
    return (
      <Card sx={{ mb: 2, position: 'relative' }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {goal.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                <Chip 
                  size="small" 
                  label={goal.subject} 
                  sx={{ bgcolor: subjectColor, color: 'white', fontSize: '0.7rem' }}
                />
                <Chip 
                  size="small" 
                  label={statusInfo.label}
                  sx={{ bgcolor: statusInfo.color, color: 'white', fontSize: '0.7rem' }}
                />
                {getTimeLeftDisplay()}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!goal.isPublic && <LockIcon fontSize="small" color="disabled" />}
              <Typography variant="h6" color="primary">
                {goal.progress}%
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={goal.progress} 
            sx={{ height: 6, borderRadius: 3, mb: 1 }}
          />
          
          <Typography variant="caption" color="text.secondary">
            {goal.actualAmount} / {goal.targetAmount} {goal.targetUnit}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 3, position: 'relative', overflow: 'visible' }}>
        {/* 상태 표시 FAB */}
        <Zoom in={true}>
          <Fab
            size="small"
            sx={{
              position: 'absolute',
              top: -10,
              right: 16,
              bgcolor: statusInfo.color,
              color: 'white',
              '&:hover': { bgcolor: statusInfo.color }
            }}
          >
            {statusInfo.icon}
          </Fab>
        </Zoom>

        <CardContent>
          {/* 헤더 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ bgcolor: subjectColor, width: 24, height: 24, fontSize: '0.8rem' }}>
                  {goal.subject[0]}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {goal.author.name}
                  {goal.author.school && ` • ${goal.author.school}`}
                </Typography>
                {!goal.isPublic && (
                  <Tooltip title="비공개 목표">
                    <LockIcon fontSize="small" color="disabled" />
                  </Tooltip>
                )}
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {goal.title}
              </Typography>
              
              {goal.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {goal.description}
                </Typography>
              )}
            </Box>
          </Box>

          {/* 목표 정보 */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip size="small" label={goal.subject} sx={{ bgcolor: subjectColor, color: 'white' }} />
            <Chip size="small" label={`${goal.targetAmount} ${goal.targetUnit}`} variant="outlined" />
            <Chip size="small" label={goal.difficulty} variant="outlined" />
            {getTimeLeftDisplay()}
          </Box>

          {/* 진행률 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                진행률: {goal.actualAmount} / {goal.targetAmount} {goal.targetUnit}
              </Typography>
              <Typography variant="h6" color="primary">
                {goal.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={goal.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* 동기 & 보상 */}
          {(goal.motivation || goal.reward) && (
            <Box sx={{ mb: 2 }}>
              {goal.motivation && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  💪 <strong>동기:</strong> {goal.motivation}
                </Typography>
              )}
              {goal.reward && (
                <Typography variant="body2">
                  🎁 <strong>보상:</strong> {goal.reward}
                </Typography>
              )}
            </Box>
          )}

          {/* 시간 정보 */}
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(goal.declaredAt, { addSuffix: true, locale: ko })} 선언 • 
            목표일: {format(goal.targetDate, 'MM월 dd일 HH:mm', { locale: ko })}
          </Typography>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          {/* 소셜 액션 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isOwner && onSupport && (
              <Button
                size="small"
                startIcon={isSupported ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={() => setSupportDialogOpen(true)}
                color={isSupported ? "error" : "inherit"}
              >
                응원 {goal.supportCount > 0 && goal.supportCount}
              </Button>
            )}
            
            <Button size="small" startIcon={<CommentIcon />} onClick={() => setCommentDialogOpen(true)}>
              댓글 {goal.commentCount > 0 && goal.commentCount}
            </Button>
          </Box>

          {/* 오너 액션 */}
          {isOwner && onUpdate && goal.status !== 'COMPLETED' && goal.status !== 'ABANDONED' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {goal.status === 'DECLARED' && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleUpdate('START')}
                >
                  시작하기
                </Button>
              )}
              
              {goal.status === 'IN_PROGRESS' && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CameraAltIcon />}
                    onClick={() => setUpdateDialogOpen(true)}
                  >
                    진행 업데이트
                  </Button>
                  
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setCompletionDialogOpen(true)}
                    color="success"
                    disabled={!canComplete}
                  >
                    완료!
                  </Button>
                </>
              )}
            </Box>
          )}
        </CardActions>
      </Card>

      {/* 응원 다이얼로그 */}
      <Dialog open={supportDialogOpen} onClose={() => setSupportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🎉 목표 응원하기</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            "{goal.title}" 목표에 응원 메시지를 남겨보세요!
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="화이팅! 응원합니다!"
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupportDialogOpen(false)}>취소</Button>
          <Button onClick={handleSupport} variant="contained">
            응원하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 진행 업데이트 다이얼로그 */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📈 진행 상황 업데이트</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label={`추가 진행량 (${goal.targetUnit})`}
            value={updateAmount}
            onChange={(e) => setUpdateAmount(Number(e.target.value))}
            sx={{ mb: 2 }}
            helperText={`현재: ${goal.actualAmount}/${goal.targetAmount} ${goal.targetUnit}`}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="업데이트 메시지"
            placeholder="어떤 공부를 했나요? 어려웠나요?"
            value={updateMessage}
            onChange={(e) => setUpdateMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>취소</Button>
          <Button 
            onClick={() => handleUpdate('PROGRESS')} 
            variant="contained"
            disabled={updateAmount <= 0}
          >
            업데이트
          </Button>
        </DialogActions>
      </Dialog>

      {/* 완료 다이얼로그 */}
      <Dialog open={completionDialogOpen} onClose={() => setCompletionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🎉 목표 완료하기</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            "{goal.title}" 목표를 완료하셨나요? 달성률을 입력해주세요.
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            label="달성률 (%)"
            value={achievementRate}
            onChange={(e) => setAchievementRate(Math.max(0, Math.min(100, Number(e.target.value))))}
            sx={{ mb: 2 }}
            inputProps={{ min: 0, max: 100 }}
            helperText={`목표: ${goal.targetAmount} ${goal.targetUnit}, 현재: ${goal.actualAmount} ${goal.targetUnit}`}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="완료 소감"
            placeholder="목표를 달성한 소감을 적어주세요!"
            value={updateMessage}
            onChange={(e) => setUpdateMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialogOpen(false)}>취소</Button>
          <Button 
            onClick={() => handleUpdate('COMPLETE')} 
            variant="contained"
            color="success"
          >
            완료하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 댓글 다이얼로그 */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>💬 댓글</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            "{goal.title}" 목표에 댓글을 남겨보세요!
          </Typography>
          
          {/* 기존 댓글 목록 (임시) */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              댓글 기능이 곧 활성화됩니다! 🚧
            </Typography>
          </Box>
          
          {/* 새 댓글 입력 */}
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="댓글을 작성해주세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>취소</Button>
          <Button 
            onClick={() => {
              // TODO: 댓글 API 구현
              console.log('댓글 작성:', newComment);
              setNewComment('');
              setCommentDialogOpen(false);
            }} 
            variant="contained"
            disabled={!newComment.trim()}
          >
            댓글 작성
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoalCard;