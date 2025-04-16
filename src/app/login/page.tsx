"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, getUserRole } from "@/lib/auth";
import { 
  Button, 
  TextField, 
  Typography, 
  Box, 
  Container, 
  Paper,
  CircularProgress
} from "@mui/material";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // 로그인 시도
      const { error, data } = await signInWithEmail(email, password);
      if (error) {
        setError(error.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        setLoading(false);
        return;
      }
      
      if (!data?.user) {
        setError('사용자 정보를 가져오는데 실패했습니다.');
        setLoading(false);
        return;
      }
      
      // 사용자 정보가 완전히 로드되도록 지연 추가
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 클라이언트 컴포넌트에서만 역할 분기 수행
      const role = await getUserRole();
      console.log('로그인 페이지 - 역할 확인:', role, typeof role); // 디버깅용 로그
      
      // 소문자 역할로 비교 (Enum 형식으로 데이터베이스 타입 일치)
      if (role === "student") {
        console.log('학생 역할 확인: 학생 대시보드로 이동');
        router.push("/dashboard/student");
      } else if (role === "teacher") {
        console.log('교사 역할 확인: 교사 대시보드로 이동');
        router.push("/dashboard/teacher");
      } else if (role === "admin") {
        console.log('관리자 역할 확인: 관리자 대시보드로 이동');
        router.push("/dashboard/admin");
      } else {
        console.error('알 수 없는 역할:', role);
        setError('역할을 확인할 수 없습니다. 다시 로그인해주세요.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          mb: 4
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          align="center" 
          gutterBottom
          color="primary"
          sx={{ fontWeight: "bold", mb: 4 }}
        >
          메타인지 학습 시스템
        </Typography>
        
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%', 
            borderRadius: 2,
            backgroundColor: "#fff" 
          }}
        >
          <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
            로그인
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
              variant="outlined"
            />
            
            <TextField
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              variant="outlined"
            />
            
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 3, py: 1.5, fontSize: "1rem" }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "로그인"
              )}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
