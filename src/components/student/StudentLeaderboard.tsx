import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText, Avatar, Box, Chip, 
  Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Tooltip, Card, CardContent
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface StudentLeaderboardProps {
  currentUserId: string;
  userRole: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  school?: string;
  score: number;
  breakdown: {
    consistency: number;
    quality: number;
    engagement: number;
    streak: number;
  };
  isCurrentUser?: boolean;
}

const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({ 
  currentUserId, 
  userRole 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  // 탭 레이블
  const tabLabels = ['전체', '이번 주', '이번 달', '내 반'];

  useEffect(() => {
    loadLeaderboardData();
  }, [activeTab, currentUserId]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // API 호출로 리더보드 데이터 가져오기
      const response = await fetch(`/api/leaderboard?period=${activeTab}&userId=${currentUserId}`);
      const data = await response.json();
      
      setLeaderboardData(data.leaderboard || []);
      setMyRank(data.myRank || null);
    } catch (error) {
      console.error('리더보드 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <EmojiEventsIcon sx={{ color: '#FFD700' }} />;
    if (rank === 2) return <EmojiEventsIcon sx={{ color: '#C0C0C0' }} />;
    if (rank === 3) return <EmojiEventsIcon sx={{ color: '#CD7F32' }} />;
    return <PersonIcon />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0'; 
    if (rank === 3) return '#CD7F32';
    return '#e0e0e0';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">🏆 학습 리더보드</Typography>
        <Button
          startIcon={<InfoIcon />}
          variant="outlined"
          size="small"
          onClick={() => setInfoDialogOpen(true)}
        >
          점수 안내
        </Button>
      </Box>

      {/* 내 순위 카드 */}
      {myRank && (
        <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: getRankColor(myRank.rank), width: 40, height: 40 }}>
                  <Typography variant="h6">{myRank.rank}</Typography>
                </Avatar>
                <Box>
                  <Typography variant="h6">내 순위: {myRank.rank}위</Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 점수: {myRank.score}점
                  </Typography>
                </Box>
              </Box>
              <TrendingUpIcon color="primary" />
            </Box>
            
            {/* 내 점수 세부 분석 */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`일관성 ${myRank.breakdown.consistency}`}
                  size="small"
                  color={getScoreColor(myRank.breakdown.consistency)}
                />
                <Chip 
                  label={`품질 ${myRank.breakdown.quality}`}
                  size="small"
                  color={getScoreColor(myRank.breakdown.quality)}
                />
                <Chip 
                  label={`참여 ${myRank.breakdown.engagement}`}
                  size="small"
                  color={getScoreColor(myRank.breakdown.engagement)}
                />
                <Chip 
                  label={`연속 ${myRank.breakdown.streak}`}
                  size="small"
                  color={getScoreColor(myRank.breakdown.streak)}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 탭 메뉴 */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {tabLabels.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {/* 리더보드 목록 */}
      {loading ? (
        <Box sx={{ py: 4 }}>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            리더보드를 불러오는 중...
          </Typography>
        </Box>
      ) : (
        <List dense>
          {leaderboardData.slice(0, 10).map((entry, index) => (
            <ListItem 
              key={entry.userId} 
              sx={{ 
                py: 1.5, 
                bgcolor: entry.isCurrentUser ? 'action.selected' : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <Avatar sx={{ bgcolor: getRankColor(entry.rank), mr: 2 }}>
                {getRankIcon(entry.rank)}
              </Avatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ fontWeight: entry.isCurrentUser ? 'bold' : 'normal' }}
                    >
                      {entry.rank}. {entry.name}
                      {entry.isCurrentUser && ' (나)'}
                    </Typography>
                    {entry.school && (
                      <Typography variant="caption" color="text.secondary">
                        ({entry.school})
                      </Typography>
                    )}
                    <Chip 
                      label={`${entry.score}점`} 
                      size="small" 
                      color="primary"
                      variant={entry.isCurrentUser ? "filled" : "outlined"}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="학습 일관성 (40%)">
                        <Chip 
                          label={entry.breakdown.consistency}
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: '45px', fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                      <Tooltip title="반성 품질 (35%)">
                        <Chip 
                          label={entry.breakdown.quality}
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: '45px', fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                      <Tooltip title="적정 참여 (15%)">
                        <Chip 
                          label={entry.breakdown.engagement}
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: '45px', fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                      <Tooltip title="연속 학습 (10%)">
                        <Chip 
                          label={entry.breakdown.streak}
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: '45px', fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* 점수 안내 다이얼로그 */}
      <Dialog 
        open={infoDialogOpen} 
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📊 리더보드 점수 시스템 안내</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>공정한 평가 기준</Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              🎯 일관성 점수 (40%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 꾸준한 학습 습관을 평가합니다<br/>
              • 최근 30일 내 학습한 날짜 비율로 계산<br/>
              • 매일 조금씩 하는 것이 몰아서 하는 것보다 유리
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="success.main" gutterBottom>
              ✍️ 반성 품질 점수 (35%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 학습 후 반성의 깊이와 성의를 평가<br/>
              • 단순 복사가 아닌 진정성 있는 반성<br/>
              • 최소 20자 이상, 학습 키워드 포함 시 가산점
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="warning.main" gutterBottom>
              📚 적정 참여 점수 (15%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 하루 최대 3세션까지만 인정<br/>
              • 과도한 몰아치기보다 적정 수준의 참여<br/>
              • 총 30세션 달성 시 만점
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="error.main" gutterBottom>
              🔥 연속 학습 보너스 (10%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 연속으로 학습한 날짜 수<br/>
              • 7일 연속 학습 시 만점<br/>
              • 학습 습관 형성을 장려
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>중요:</strong> 성취도(달성률)는 점수에 반영되지 않습니다. 
              꾸준함과 성의있는 학습 자세가 더 중요합니다!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>확인</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default StudentLeaderboard;