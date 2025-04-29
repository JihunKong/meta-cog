"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, getUserRole, signUpWithEmail } from "@/lib/auth";
import { 
  Button, 
  TextField, 
  Typography, 
  Box, 
  Container, 
  Paper,
  CircularProgress,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

export default function LoginPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupSchool, setSignupSchool] = useState("");
  const [signupGrade, setSignupGrade] = useState("");
  const [signupClass, setSignupClass] = useState("");
  const [signupNumber, setSignupNumber] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 임시 학교 목록 (추후 API 연동)
  const schoolList = ["완도고등학교", "금성고등학교"];

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
        router.push("/dashboard/student");
      } else if (role === "teacher") {
        router.push("/dashboard/teacher");
      } else if (role === "admin") {
        router.push("/dashboard/admin");
      } else {
        setError('역할을 확인할 수 없습니다. 다시 로그인해주세요.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 학교 선택 유효성 검사 추가
    if (!signupName || !signupSchool || !signupGrade || !signupClass || !signupNumber) {
      setSignupError("모든 학생 정보를 입력해주세요.");
      return;
    }
    if (!schoolList.includes(signupSchool)) { // 선택된 학교가 목록에 있는지 확인
      setSignupError("유효한 학교를 선택해주세요.");
      return;
    }
    
    setSignupLoading(true);
    setSignupError("");
    try {
      const { error, data } = await signUpWithEmail(
        signupEmail, 
        signupPassword, 
        {
          name: signupName,
          school: signupSchool,
          grade: signupGrade,
          classNum: signupClass, 
          studentNum: signupNumber 
        } 
      );
      if (error) {
        setSignupError(error.message || '회원가입에 실패했습니다.');
      } else {
        alert('회원가입 성공! 로그인해주세요.');
        setShowSignup(false);
        setSignupEmail("");
        setSignupPassword("");
        setSignupName("");
        setSignupSchool("");
        setSignupGrade("");
        setSignupClass("");
        setSignupNumber("");
      }
    } catch (err: any) {
      setSignupError(err.message || '회원가입 중 오류 발생');
    }
    setSignupLoading(false);
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
          {showSignup ? (
            <>
              <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
                학생 회원가입
              </Typography>
              <form onSubmit={handleSignupSubmit}>
                <TextField label="이메일" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} fullWidth margin="normal" required variant="outlined" />
                <TextField label="비밀번호" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} fullWidth margin="normal" required variant="outlined" />
                <TextField label="이름" value={signupName} onChange={(e) => setSignupName(e.target.value)} fullWidth margin="normal" required variant="outlined" />
                <FormControl fullWidth margin="normal" required variant="outlined">
                  <InputLabel id="school-select-label">학교</InputLabel>
                  <Select
                    labelId="school-select-label"
                    value={signupSchool}
                    onChange={(e) => setSignupSchool(e.target.value)}
                    label="학교"
                  >
                    <MenuItem value="">
                      <em>학교를 선택하세요</em>
                    </MenuItem>
                    {schoolList.map((school) => (
                      <MenuItem key={school} value={school}>{school}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField label="학년" type="number" value={signupGrade} onChange={(e) => setSignupGrade(e.target.value)} fullWidth margin="normal" required variant="outlined" size="small" />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField label="반" type="number" value={signupClass} onChange={(e) => setSignupClass(e.target.value)} fullWidth margin="normal" required variant="outlined" size="small" />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField label="번호" type="number" value={signupNumber} onChange={(e) => setSignupNumber(e.target.value)} fullWidth margin="normal" required variant="outlined" size="small" />
                  </Grid>
                </Grid>
                {signupError && (
                  <Typography color="error" sx={{ mt: 2 }}>{signupError}</Typography>
                )}
                <Button type="submit" variant="contained" color="secondary" fullWidth disabled={signupLoading} sx={{ mt: 3, py: 1.5 }}>
                  {signupLoading ? <CircularProgress size={24} color="inherit" /> : "회원가입"}
                </Button>
                <Button onClick={() => setShowSignup(false)} fullWidth sx={{ mt: 1 }}>
                  로그인으로 돌아가기
                </Button>
              </form>
            </>
          ) : (
            <>
              <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
                로그인
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth margin="normal" required variant="outlined" />
                <TextField label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" required variant="outlined" />
                {error && (
                  <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
                )}
                <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 3, py: 1.5 }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : "로그인"}
                </Button>
              </form>
              <Button onClick={() => setShowSignup(true)} fullWidth sx={{ mt: 2 }}>
                학생 회원가입
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
