import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Tabs, Tab, Fab, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Card, CardContent, Alert, Skeleton, Chip, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GoalCard from './GoalCard';
import GoalDeclarationForm from './GoalDeclarationForm';

interface GoalsFeedProps {
  currentUserId: string;
  userRole: string;
}

interface Goal {
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
}

const SUBJECTS = ['전체', '국어', '영어', '수학', '과학', '사회'];
const STATUSES = ['전체', '선언됨', '진행중', '완료', '실패'];
const SORT_OPTIONS = [
  { value: 'recent', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'deadline', label: '마감임박순' },
  { value: 'progress', label: '진행률순' }
];

const GoalsFeed: React.FC<GoalsFeedProps> = ({ currentUserId, userRole }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: 전체, 1: 내 목표, 2: 친구 목표
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [sortBy, setSortBy] = useState('recent');
  
  // 폼 상태
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const tabLabels = ['🌍 전체 목표', '📝 내 목표', '👥 친구 목표'];

  // 목표 목록 로드
  const loadGoals = async (reset = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId: currentUserId,
        filter: activeTab === 0 ? 'public' : activeTab === 1 ? 'my' : 'friends',
        limit: '20',
        offset: reset ? '0' : goals.length.toString()
      });

      if (selectedSubject !== '전체') params.append('subject', selectedSubject);
      if (selectedStatus !== '전체') {
        const statusMap: Record<string, string> = {
          '선언됨': 'DECLARED',
          '진행중': 'IN_PROGRESS', 
          '완료': 'COMPLETED',
          '실패': 'FAILED'
        };
        params.append('status', statusMap[selectedStatus]);
      }

      // 1차: 간단한 목표 API 시도
      let response = await fetch(`/api/goals-simple?${params}`);
      let data = await response.json();

      if (!response.ok || !data.success) {
        console.log('간단한 목표 API 실패, 기존 API 시도');
        // 2차: 기존 API로 폴백
        response = await fetch(`/api/goals/declarations?${params}`);
        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '목표를 불러오는 중 오류가 발생했습니다.');
        }
      } else {
        console.log('간단한 목표 API 성공');
      }

      const newGoals = data.goals.map((goal: any) => ({
        ...goal,
        declaredAt: new Date(goal.declaredAt),
        targetDate: new Date(goal.targetDate),
        updatedAt: new Date(goal.updatedAt)
      }));

      // 검색 필터링
      const filteredGoals = searchQuery 
        ? newGoals.filter((goal: Goal) => 
            goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            goal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            goal.author.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : newGoals;

      // 정렬
      const sortedGoals = sortGoals(filteredGoals, sortBy);

      setGoals(reset ? sortedGoals : [...goals, ...sortedGoals]);
      setHasMore(data.hasMore);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 목표 정렬
  const sortGoals = (goalList: Goal[], sortOption: string): Goal[] => {
    const sorted = [...goalList];
    
    switch (sortOption) {
      case 'popular':
        return sorted.sort((a, b) => (b.supportCount + b.commentCount) - (a.supportCount + a.commentCount));
      case 'deadline':
        return sorted.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
      case 'progress':
        return sorted.sort((a, b) => b.progress - a.progress);
      case 'recent':
      default:
        return sorted.sort((a, b) => b.declaredAt.getTime() - a.declaredAt.getTime());
    }
  };

  // 목표 선언
  const handleCreateGoal = async (goalData: any) => {
    setFormLoading(true);
    try {
      const response = await fetch('/api/goals/declarations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '목표 선언 중 오류가 발생했습니다.');
      }

      // 목표 목록 새로고침
      loadGoals(true);
      
    } catch (error: any) {
      console.error('목표 선언 실패:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // 목표 응원
  const handleSupport = async (goalId: string, message?: string) => {
    try {
      const response = await fetch('/api/goals/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          supporterId: currentUserId,
          supportType: 'CHEER',
          message: message || '',
          isAnonymous: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '응원 중 오류가 발생했습니다.');
      }

      // 로컬 상태 업데이트
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, supportCount: goal.supportCount + 1 }
          : goal
      ));

    } catch (error: any) {
      console.error('응원 실패:', error);
      throw error;
    }
  };

  // 목표 업데이트
  const handleUpdate = async (goalId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/goals/declarations/${goalId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updateData,
          userId: currentUserId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '업데이트 중 오류가 발생했습니다.');
      }

      // 로컬 상태 업데이트
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { 
              ...goal, 
              progress: data.newProgress,
              status: data.newStatus,
              actualAmount: goal.actualAmount + (updateData.progressAmount || 0)
            }
          : goal
      ));

    } catch (error: any) {
      console.error('업데이트 실패:', error);
      throw error;
    }
  };

  // 효과
  useEffect(() => {
    loadGoals(true);
  }, [activeTab, selectedSubject, selectedStatus, sortBy]);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => loadGoals(true), 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadGoals(true);
    }
  }, [searchQuery]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon color="primary" />
          목표 선언 광장
        </Typography>
        
        <Fab
          color="primary"
          onClick={() => setGoalFormOpen(true)}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* 탭 */}
      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        {tabLabels.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {/* 필터 & 검색 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="목표, 작성자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>과목</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="과목"
                >
                  {SUBJECTS.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>상태</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="상태"
                >
                  {STATUSES.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>정렬</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="정렬"
                >
                  {SORT_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 목표 목록 */}
      {loading && goals.length === 0 ? (
        <Box>
          {[...Array(3)].map((_, index) => (
            <Card key={index} sx={{ mb: 3 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Skeleton variant="rounded" width={60} height={24} />
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="rounded" width={70} height={24} />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={8} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : goals.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              목표가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              첫 번째 목표를 선언해보세요!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setGoalFormOpen(true)}
            >
              목표 선언하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currentUserId={currentUserId}
              isOwner={goal.author.id === currentUserId}
              onSupport={handleSupport}
              onUpdate={handleUpdate}
              onComment={(goalId) => {
                // TODO: 댓글 다이얼로그 열기
                console.log('댓글 클릭:', goalId);
              }}
            />
          ))}
          
          {hasMore && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => loadGoals()}
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더 보기'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* 목표 선언 폼 */}
      <GoalDeclarationForm
        open={goalFormOpen}
        onClose={() => setGoalFormOpen(false)}
        onSubmit={handleCreateGoal}
        userId={currentUserId}
        loading={formLoading}
      />
    </Container>
  );
};

export default GoalsFeed;