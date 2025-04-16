"use client";

import { Box, Typography, Card, CardContent, Grid, Alert } from "@mui/material";

interface AIAdviceProps {
  sessions: Array<{
    id: string;
    user_id: string;
    subject: string;
    description: string;
    percent: number;
    reflection: string;
    created_at: string;
  }>;
}

// AI 어드바이스 생성 함수
const getAIAdvice = (subject: string, average: number): string => {
  if (average >= 90) {
    return `${subject} 학습에서 뛰어난 성과를 보이고 있습니다! 지금처럼 꾸준히 학습을 이어가세요. 더 높은 수준의 문제에 도전해 보는 것도 좋은 방법입니다.`;
  } else if (average >= 80) {
    return `${subject} 학습에서 좋은 성과를 보이고 있습니다. 부족한 부분을 집중적으로 보완하면 더 나은 결과를 얻을 수 있을 것입니다.`;
  } else if (average >= 70) {
    return `${subject} 학습에서 노력하고 있지만, 기본 개념을 다시 점검해 볼 필요가 있습니다. 기초부터 차근차근 다지는 것이 중요합니다.`;
  } else if (average >= 50) {
    return `${subject} 학습에 어려움을 겪고 있는 것 같습니다. 선생님이나 친구들에게 도움을 요청하거나, 기초 개념부터 다시 시작해 보세요.`;
  } else {
    return `${subject} 학습에 많은 어려움을 겪고 있습니다. 학습 계획을 재설정하고, 기초 개념부터 천천히 시작해 보세요. 꾸준한 노력이 중요합니다.`;
  }
};

export default function AIAdviceView({ sessions }: AIAdviceProps) {
  // 과목별 평균 달성률 계산
  const subjectStats = sessions.reduce((acc: Record<string, { total: number; count: number }>, session) => {
    if (session.percent) {
      if (!acc[session.subject]) {
        acc[session.subject] = { total: 0, count: 0 };
      }
      acc[session.subject].total += session.percent;
      acc[session.subject].count += 1;
    }
    return acc;
  }, {});

  // 과목별 세션 수 계산
  const subjectCounts = sessions.reduce((acc: Record<string, number>, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + 1;
    return acc;
  }, {});

  // 과목별 데이터 생성
  const subjectData = Object.keys(subjectCounts).map(subject => {
    const average = subjectStats[subject]?.count > 0
      ? Math.round(subjectStats[subject].total / subjectStats[subject].count)
      : 0;
    
    return {
      subject,
      count: subjectCounts[subject],
      average,
      advice: getAIAdvice(subject, average)
    };
  });

  if (subjectData.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        아직 등록된 학습 세션이 없습니다. 학습 세션을 추가해 보세요.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {subjectData.map((item) => (
          <Grid item xs={12} key={item.subject}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{item.subject}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">총 세션 수: {item.count}회</Typography>
                  <Typography variant="body2" color="text.secondary">
                    평균 달성률: {item.average}%
                  </Typography>
                </Box>
                <Typography variant="body1">{item.advice}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
