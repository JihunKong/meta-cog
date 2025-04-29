"use client";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { Box, Typography, Alert } from "@mui/material";

interface Session {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  percent: number;
  reflection: string;
  created_at: string;
}

interface CalendarViewProps {
  sessions: Session[];
}

// 과목별 색상 지정 함수
const getSubjectColor = (subject: string): string => {
  const colorMap: Record<string, string> = {
    "국어": "#e57373", // 빨간계열
    "영어": "#64b5f6", // 파란계열
    "수학": "#81c784", // 초록계열
    "과학": "#9575cd", // 보라계열
    "사회": "#ffb74d"  // 주황계열
  };
  
  return colorMap[subject] || "#90a4ae"; // 기본값
};

// 달력 일자 생성 함수
const generateCalendarDays = (): (Date | null)[] => {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  // 해당 월의 모든 날짜 가져오기
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth
  });
  
  // 첫째 주의 첫째 날 채우기
  const startWeekday = firstDayOfMonth.getDay(); // 0: 일요일, 1: 월요일, ...
  const prefixDays = Array(startWeekday).fill(null);
  
  // 마지막 주의 마지막 날 채우기
  const endWeekday = lastDayOfMonth.getDay();
  const suffixDays = Array(6 - endWeekday).fill(null);
  
  return [...prefixDays, ...daysInMonth, ...suffixDays];
};

const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function CalendarView({ sessions }: CalendarViewProps) {
  if (sessions.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        아직 등록된 학습 세션이 없습니다. 학습 세션을 추가해보세요.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* 달력 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{format(new Date(), 'yyyy년 MM월')}</Typography>
        <Box>
          {/* 나중에 월 넘기기 버튼 추가 가능 */}
        </Box>
      </Box>
      
      {/* 요일 표시 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: 1 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <Typography key={i} sx={{ fontWeight: 'bold', color: i === 0 ? 'error.main' : 'text.primary' }}>
            {day}
          </Typography>
        ))}
      </Box>
      
      {/* 달력 그리드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {generateCalendarDays().map((day, i) => {
          // 해당 날짜의 세션 찾기
          const dayStr = day ? format(day, 'yyyy-MM-dd') : '';
          const daySessions = sessions.filter(s => s.created_at.substring(0, 10) === dayStr);
          const hasSession = daySessions.length > 0;
          
          // 오늘 날짜와 현재 월의 날짜인지 확인
          const isCurrentDay = day && isToday(day);
          const isCurrentMonth = day && day.getMonth() === new Date().getMonth();
          
          return (
            <Box 
              key={i} 
              sx={{
                p: 1,
                height: '100px',
                border: '1px solid',
                borderColor: isCurrentDay ? 'primary.main' : 'grey.300',
                borderRadius: 1,
                backgroundColor: isCurrentDay ? 'primary.50' : (isCurrentMonth ? 'background.paper' : 'grey.50'),
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: hasSession ? 'pointer' : 'default',
                }
              }}
              onClick={() => {
                if (hasSession) {
                  // 추후 세션 상세 보기 기능 추가 가능
                }
              }}
            >
              {day && (
                <>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: isCurrentDay ? 'bold' : 'normal',
                      color: !isCurrentMonth ? 'text.disabled' : 
                             format(day, 'E') === 'Sun' ? 'error.main' : 
                             'text.primary'
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  
                  {hasSession && (
                    <Box sx={{ mt: 'auto' }}>
                      {daySessions.map((session, idx) => (
                        <Box 
                          key={idx} 
                          sx={{ 
                            mt: 0.5, 
                            p: 0.5, 
                            bgcolor: getSubjectColor(session.subject), 
                            borderRadius: 0.5,
                            fontSize: '0.7rem',
                            color: 'white',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {session.subject}: {session.percent ? `${session.percent}%` : '진행중'}
                        </Box>
                      ))}
                      
                      {daySessions.length > 2 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          +{daySessions.length - 2} 더 보기
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          );
        })}
      </Box>
      
      {/* 과목별 색상 밸런스 */}
      <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {SUBJECTS.map(subject => (
          <Box key={subject} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getSubjectColor(subject), mr: 1 }} />
            <Typography variant="caption">{subject}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
