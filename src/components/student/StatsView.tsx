"use client";

import { Box, Typography, Grid, Alert } from "@mui/material";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

interface StatsViewProps {
  statsData: {
    recentPerformance: { date: string; value: number }[];
    subjectPerformance: { subject: string; average: number }[];
    weekdayFrequency: { day: string; count: number }[];
  };
}

export default function StatsView({ statsData }: StatsViewProps) {
  return (
    <Grid container spacing={3}>
      {/* 최근 달성율 차트 */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>최근 달성률 추이</Typography>
        <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
          {statsData.recentPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsData.recentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="value" stroke="#1976d2" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">아직 데이터가 없습니다</Typography>
            </Box>
          )}
        </Box>
      </Grid>
      
      {/* 과목별 평균 달성률 */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom>과목별 평균 달성률</Typography>
        <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
          {statsData.subjectPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="average" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">아직 데이터가 없습니다</Typography>
            </Box>
          )}
        </Box>
      </Grid>
      
      {/* 요일별 학습 빈도 */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom>최근 4주간 요일별 학습 빈도</Typography>
        <Box sx={{ height: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
          {statsData.weekdayFrequency.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.weekdayFrequency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" name="학습 횟수" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">아직 데이터가 없습니다</Typography>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}
