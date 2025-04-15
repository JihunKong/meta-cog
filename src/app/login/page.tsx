"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, getUserRole } from "@/lib/auth";
import { Button, TextField, Typography, Box } from "@mui/material";

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
      
      // 역할에 따라 분기
      const role = await getUserRole();
      
      // role이 없으면 기본 대시보드로 이동
      if (role === "STUDENT") router.replace("/dashboard/student");
      else if (role === "TEACHER") router.replace("/dashboard/teacher");
      else if (role === "ADMIN") router.replace("/dashboard/admin");
      else router.replace("/dashboard"); // 역할이 없으면 기본 대시보드로
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Typography variant="h4" gutterBottom>로그인</Typography>
      <form onSubmit={handleSubmit} style={{ width: 300 }}>
        <TextField
          label="이메일"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <TextField
          label="비밀번호"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2 }}>
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </Box>
  );
}
