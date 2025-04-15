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
    const { error } = await signInWithEmail(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // 역할에 따라 분기
    const role = await getUserRole();
    if (role === "STUDENT") router.push("/dashboard/student");
    else if (role === "TEACHER") router.push("/dashboard/teacher");
    else if (role === "ADMIN") router.push("/dashboard/admin");
    else router.push("/dashboard");
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
