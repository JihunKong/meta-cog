"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

interface SignInFormProps {
  callbackUrl?: string;
}

export default function SignInForm({ callbackUrl = '/dashboard' }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // 테스트 계정 자동 입력 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setFormData({
        email: "admin@pof.com",
        password: "admin1234"
      });
    }
  }, []);

  // 로그인 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // 오류 메시지 초기화
    
    if (!formData.email || !formData.password) {
      setError("이메일과 비밀번호를 모두 입력해주세요");
      return;
    }
    
    try {
      setLoading(true);
      
      console.log("로그인 시도:", formData.email);
      
      // 테스트 관리자 계정 직접 처리
      if (formData.email === 'admin@pof.com' && formData.password === 'admin1234') {
        console.log('테스트 관리자 계정 직접 처리');
        
        // 직접 로그인 시도
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false
        });
        
        console.log('테스트 관리자 로그인 결과:', result);
        
        if (result?.error) {
          console.error('테스트 관리자 로그인 오류:', result.error);
          setError(result.error || '로그인에 실패했습니다');
        } else if (result?.ok) {
          console.log('테스트 관리자 로그인 성공, 관리자 대시보드로 이동');
          // 직접 관리자 대시보드로 리디렉션
          window.location.href = '/admin/dashboard';
          return;
        }
      } else {
        // 일반 사용자 로그인 처리
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false
        });
        
        console.log("로그인 결과:", result);
        
        if (result?.error) {
          console.error("로그인 오류:", result.error);
          setError(result.error || "로그인에 실패했습니다");
        } else if (result?.ok) {
          console.log("로그인 성공, 대시보드로 이동");
          // 직접 대시보드로 리디렉션
          window.location.href = '/dashboard';
        }
      }
      
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
      setError("로그인 처리 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 관리자 대시보드로 바로 이동
  const handleDirectAccess = () => {
    router.push('/dashboard');
  };

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          {/* 오류 메시지 표시 영역 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              id="email"
              label="이메일"
              type="email"
              placeholder="이메일 주소"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              id="password"
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ 
              py: 1.5,
              mb: 2,
              background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
              '&:hover': {
                background: 'linear-gradient(to right, #2563eb, #4338ca)'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                로그인 중...
              </Box>
            ) : "로그인"}
          </Button>

          {/* 개발 환경에서만 표시되는 직접 접근 버튼 */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              type="button"
              onClick={handleDirectAccess}
              fullWidth
              variant="contained"
              color="success"
              sx={{ py: 1.5 }}
            >
              관리자 대시보드로 바로 이동
            </Button>
          )}
        </form>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            관리자가 발급한 계정으로 로그인하세요.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            계정이 없으시면 관리자에게 문의하세요.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
} 