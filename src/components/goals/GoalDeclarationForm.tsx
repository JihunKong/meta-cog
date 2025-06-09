import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Box, Typography, Chip, Alert, Stepper, Step, StepLabel, Card, CardContent,
  InputAdornment, Slider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

interface GoalDeclarationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: any) => Promise<void>;
  userId: string;
  loading?: boolean;
}

const SUBJECTS = [
  { value: '국어', label: '📚 국어', color: '#ff6b6b' },
  { value: '영어', label: '🌍 영어', color: '#4ecdc4' },
  { value: '수학', label: '🔢 수학', color: '#45b7d1' },
  { value: '과학', label: '🔬 과학', color: '#96ceb4' },
  { value: '사회', label: '🌏 사회', color: '#ffeaa7' }
];

const TARGET_TYPES = [
  { value: 'TIME', label: '시간', icon: '⏰', unit: '분' },
  { value: 'PROBLEMS', label: '문제수', icon: '📝', unit: '문제' },
  { value: 'PAGES', label: '페이지', icon: '📖', unit: '페이지' },
  { value: 'SESSIONS', label: '세션', icon: '🎯', unit: '회' }
];

const DIFFICULTIES = [
  { value: 'EASY', label: '쉬움', color: '#27ae60', description: '가벼운 마음으로 도전' },
  { value: 'MEDIUM', label: '보통', color: '#f39c12', description: '적당한 노력이 필요' },
  { value: 'HARD', label: '어려움', color: '#e74c3c', description: '상당한 집중이 필요' },
  { value: 'EXPERT', label: '전문가', color: '#8e44ad', description: '최고의 실력 필요' }
];

const GoalDeclarationForm: React.FC<GoalDeclarationFormProps> = ({
  open,
  onClose,
  onSubmit,
  userId,
  loading = false
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    targetType: 'TIME',
    targetAmount: 60,
    targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 내일
    deadlineTime: null as Date | null,
    difficulty: 'MEDIUM',
    isPublic: true,
    motivation: '',
    reward: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = ['기본 정보', '목표 설정', '동기 & 보상'];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = '목표 제목을 입력해주세요';
      if (!formData.subject) newErrors.subject = '과목을 선택해주세요';
    }

    if (step === 1) {
      if (formData.targetAmount <= 0) newErrors.targetAmount = '목표량을 입력해주세요';
      if (formData.targetDate <= new Date()) newErrors.targetDate = '미래 날짜를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      await onSubmit({
        ...formData,
        userId,
        targetUnit: TARGET_TYPES.find(t => t.value === formData.targetType)?.unit || '개'
      });
      handleClose();
    } catch (error) {
      console.error('목표 선언 실패:', error);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      title: '',
      description: '',
      subject: '',
      targetType: 'TIME',
      targetAmount: 60,
      targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      deadlineTime: null,
      difficulty: 'MEDIUM',
      isPublic: true,
      motivation: '',
      reward: ''
    });
    setErrors({});
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ space: 3 }}>
            <TextField
              fullWidth
              label="목표 제목"
              placeholder="예: 오늘 수학 3시간 완주!"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              error={!!errors.title}
              helperText={errors.title || '구체적이고 동기부여가 되는 제목을 작성해보세요'}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="목표 설명 (선택)"
              placeholder="목표에 대한 구체적인 계획을 작성해보세요"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth error={!!errors.subject} sx={{ mb: 3 }}>
              <InputLabel>과목 선택</InputLabel>
              <Select
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                label="과목 선택"
              >
                {SUBJECTS.map(subject => (
                  <MenuItem key={subject.value} value={subject.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{subject.label}</span>
                      <Chip 
                        size="small" 
                        label={subject.value} 
                        sx={{ bgcolor: subject.color, color: 'white' }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formData.isPublic ? <PublicIcon /> : <LockIcon />}
                  <span>{formData.isPublic ? '공개 목표' : '비공개 목표'}</span>
                </Box>
              }
              sx={{ mb: 2 }}
            />
            
            <Alert severity="info" sx={{ mb: 2 }}>
              {formData.isPublic 
                ? '다른 학생들이 응원할 수 있고, 리더보드에 표시됩니다.'
                : '나만 볼 수 있는 개인 목표입니다.'
              }
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ space: 3 }}>
            <Typography variant="h6" gutterBottom>목표량 설정</Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>목표 타입</InputLabel>
              <Select
                value={formData.targetType}
                onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value }))}
                label="목표 타입"
              >
                {TARGET_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                목표량: {formData.targetAmount}{TARGET_TYPES.find(t => t.value === formData.targetType)?.unit}
              </Typography>
              <Slider
                value={formData.targetAmount}
                onChange={(_, value) => setFormData(prev => ({ ...prev, targetAmount: value as number }))}
                min={formData.targetType === 'TIME' ? 30 : 1}
                max={formData.targetType === 'TIME' ? 480 : 100}
                step={formData.targetType === 'TIME' ? 15 : 1}
                marks={formData.targetType === 'TIME' ? [
                  { value: 60, label: '1시간' },
                  { value: 180, label: '3시간' },
                  { value: 300, label: '5시간' }
                ] : undefined}
                valueLabelDisplay="auto"
              />
            </Box>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <DateTimePicker
                label="목표 달성 예정일"
                value={formData.targetDate}
                onChange={(date) => setFormData(prev => ({ ...prev, targetDate: date || new Date() }))}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={!!errors.targetDate}
                    helperText={errors.targetDate}
                    sx={{ mb: 3 }}
                  />
                )}
                minDateTime={new Date()}
              />
            </LocalizationProvider>

            <Typography variant="h6" gutterBottom>난이도 설정</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
              {DIFFICULTIES.map(diff => (
                <Card 
                  key={diff.value}
                  sx={{ 
                    cursor: 'pointer',
                    border: formData.difficulty === diff.value ? 2 : 1,
                    borderColor: formData.difficulty === diff.value ? diff.color : 'divider'
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: diff.value }))}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ color: diff.color, mb: 1 }}
                    >
                      {diff.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {diff.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ space: 3 }}>
            <TextField
              fullWidth
              label="목표를 달성하고 싶은 이유"
              placeholder="왜 이 목표를 달성하고 싶나요? 동기를 적어보세요."
              multiline
              rows={3}
              value={formData.motivation}
              onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
              sx={{ mb: 3 }}
              helperText="구체적인 동기를 적으면 목표 달성 가능성이 높아집니다"
            />

            <TextField
              fullWidth
              label="목표 달성 시 자신에게 줄 보상"
              placeholder="목표를 달성하면 자신에게 무엇을 해줄 건가요?"
              value={formData.reward}
              onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
              sx={{ mb: 3 }}
              helperText="작은 보상이라도 동기부여에 큰 도움이 됩니다"
            />

            <Card sx={{ bgcolor: 'primary.50', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎯 목표 요약
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>제목:</strong> {formData.title}</Typography>
                  <Typography><strong>과목:</strong> {formData.subject}</Typography>
                  <Typography>
                    <strong>목표:</strong> {formData.targetAmount}
                    {TARGET_TYPES.find(t => t.value === formData.targetType)?.unit}
                  </Typography>
                  <Typography>
                    <strong>기한:</strong> {formData.targetDate.toLocaleDateString('ko-KR')}
                  </Typography>
                  <Typography>
                    <strong>난이도:</strong> {DIFFICULTIES.find(d => d.value === formData.difficulty)?.label}
                  </Typography>
                  <Typography>
                    <strong>공개 여부:</strong> {formData.isPublic ? '공개' : '비공개'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon color="primary" />
        <span>새로운 목표 선언하기</span>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose}>취소</Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack}>이전</Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            다음
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? undefined : <EmojiEventsIcon />}
          >
            {loading ? '선언 중...' : '목표 선언하기!'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GoalDeclarationForm;