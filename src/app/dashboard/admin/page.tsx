"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Chip, MenuItem, Select, Button, CircularProgress, TextField, FormControl, InputLabel } from "@mui/material";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"STUDENT"|"TEACHER"|"ADMIN">("STUDENT");

  // [설명] 사용자 추가를 위한 입력값 state입니다.
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState(""); // 비밀번호 필드 추가
  // 역할을 소문자로 변경 (enum 형식에 맞춰서)
  const [newRole, setNewRole] = useState<"student"|"teacher"|"admin">("student");
  const [addingUser, setAddingUser] = useState(false); // 사용자 추가 진행 상태
  
  // 인증 관련 상태
  const [role, setRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false); // 인증 확인 완료 여부
  const [authError, setAuthError] = useState<string | null>(null); // 인증 오류 메시지
  const router = useRouter();

  // [설명] '추가' 버튼 클릭 시 실행되는 함수입니다. 입력값으로 새 사용자를 추가합니다.
  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('이름, 이메일, 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    setAddingUser(true);
    
    try {
      console.log('Adding new user with name:', newName);
      
      // 1. profiles 테이블에 사용자 추가
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          // id는 UUID 형태로 자동 생성됨
          email: newEmail,
          role: newRole,
          name: newName, // 이름 추가
        })
        .select();
      
      if (profileError) throw profileError;
      
      // 2. User 테이블에도 동일한 정보 추가 (이름과 역할을 저장하기 위해)
      if (profileData && profileData.length > 0) {
        const { error: userError } = await supabase
          .from('User')
          .insert({
            id: profileData[0].id, // profiles의 id와 동일하게 설정
            email: newEmail,
            name: newName,
            role: newRole,
            password: newPassword // 비밀번호 저장
          });
        
        if (userError) {
          console.error('User 테이블 삽입 오류:', userError);
          // User 테이블 오류는 무시하고 계속 진행
        }
      }
      
      // 성공 메시지 표시
      alert('사용자가 성공적으로 추가되었습니다.');
      
      // UI 업데이트 및 입력창 초기화
      fetchUsers();
      setNewName(""); 
      setNewEmail("");
      setNewPassword(""); 
      setNewRole("student"); // 소문자로 변경
    } catch (error: any) {
      console.error('사용자 추가 오류:', error.message);
      alert('사용자 추가 실패: ' + error.message);
    } finally {
      setAddingUser(false); // 상태 초기화
    }
  };
  
  // 클라이언트에서 역할 검사 (SSR에서는 권한 분기하지 않음)
  useEffect(() => {
    let mounted = true; // 컴포넌트가 마운트된 상태인지 추적

    const checkAuth = async () => {
      try {
        console.log("Admin dashboard - Checking auth...");
        // 인증 확인 시작
        setAuthError(null);
        
        // 사용자 역할 조회
        const r = await getUserRole();
        
        // 컴포넌트가 언마운트된 경우 상태 업데이트 중단
        if (!mounted) return;
        
        console.log('Admin dashboard - User role:', r);
        console.log('Admin dashboard - Role type check:', typeof r, r);
        
        // 역할이 없거나 확인되지 않음
        if (!r) {
          console.error('Admin dashboard - No role found');
          setAuthError("역할을 확인할 수 없습니다. 다시 로그인해주세요.");
          setAuthChecked(true);
          return;
        }
        
        // 소문자 'admin'으로 비교 (enum 데이터베이스 타입에 맞춰기)
        if (r !== "admin") {
          console.log('Redirecting from admin dashboard - wrong role:', r);
          // 리디렉션 강화: replace 사용 (브라우저 히스토리에 추가하지 않음)
          window.location.replace("/dashboard/" + r);
          return;
        }
        
        // admin 역할인 경우만 상태 업데이트
        setRole(r);
        setAuthChecked(true); // 인증 확인 완료
        console.log('Admin dashboard - Auth success, fetching users');
        fetchUsers();
      } catch (err) {
        console.error('Auth check error:', err);
        if (mounted) {
          setAuthError("인증 오류가 발생했습니다. 다시 로그인해주세요.");
          setAuthChecked(true); // 인증 확인은 완료되었지만 오류 발생
        }
      }
    };

    // 역할 확인
    checkAuth();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      mounted = false;
    };
  }, [router]);

  // 사용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setUsers([]); // 기존 데이터 초기화
      
      // 1. profiles에서 가져오기 (name 포함)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, name, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // 2. User 테이블에서 이름 가져오기 시도 (배치)
      const ids = profiles.map(p => p.id);
      const { data: userRows } = await supabase
        .from('User')
        .select('id, name')
        .in('id', ids);
      
      // id를 키로 하는 사용자 이름 맵 생성
      const nameMap: Record<string, string> = {};
      if (userRows) {
        userRows.forEach(user => {
          if (user.name) nameMap[user.id] = user.name;
        });
      }
      
      // 사용자 데이터 포맷팅 (우선순위: User의 name > profile의 name > 이메일에서 추출)
      const formattedUsers = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || '이메일 없음',
        name: nameMap[profile.id] || profile.name || profile.email?.split('@')[0] || '이름 없음',
        role: profile.role?.toUpperCase() as "STUDENT" | "TEACHER" | "ADMIN" || 'STUDENT'
      }));
      
      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('사용자 데이터 로드 오류:', error.message);
    }
  };

  // 역할 변경 핸들러 - 실제 Supabase 데이터 업데이트
  const handleRoleChange = async (id: string, newRole: "STUDENT"|"TEACHER"|"ADMIN") => {
    try {
      // Supabase 프로필 테이블 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole.toLowerCase() }) // 소문자로 저장
        .eq('id', id);
        
      if (error) throw error;
      
      // UI 업데이트 및 상태 초기화
      fetchUsers();
      setEditRoleId(null);
    } catch (error: any) {
      console.error('역할 변경 오류:', error.message);
      alert('역할 변경 실패: ' + error.message);
    }
  };

  // 인증 상태에 따른 UI 렌더링
  if (!authChecked) {
    // 인증 확인 중
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>권한 확인 중...</Typography>
      </Box>
    );
  }
  
  // 인증 오류 발생
  if (authError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error" variant="h6">
          {authError}
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => window.location.replace('/login')}
        >
          로그인으로 이동
        </Button>
      </Box>
    );
  }
  
  // 역할이 관리자가 아님
  if (!role || role !== "admin") {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="warning.main" variant="h6">
          관리자 권한이 없습니다.
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => window.location.replace('/dashboard')}
        >
          대시보드로 이동
        </Button>
      </Box>
    );
  }
  
  // admin 역할인 경우만 대시보드 렌더링
  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>관리자 대시보드</Typography>
        <LogoutButton />
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>전체 사용자 목록 및 역할</Typography>
      
      <Card sx={{ mt: 2 }}>
        <CardContent>
          {/* 사용자 추가 폼 */}
          <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
              사용자 추가
            </Typography>
            
            <TextField
              label="이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
            />
            
            <TextField
              label="이메일"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
            />
            
            <TextField
              label="비밀번호"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
            />
            
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel id="role-select-label">역할</InputLabel>
              <Select
                labelId="role-select-label"
                value={newRole}
                label="역할"
                onChange={(e) => setNewRole(e.target.value as "student"|"teacher"|"admin")}
              >
                <MenuItem value="student">학생</MenuItem>
                <MenuItem value="teacher">교사</MenuItem>
                <MenuItem value="admin">관리자</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="contained" 
              onClick={handleAddUser}
              disabled={addingUser}
              sx={{ mt: 1 }}
            >
              {addingUser ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  추가 중...
                </>
              ) : '추가'}
            </Button>
          </Box>
          
          <Typography variant="h6">사용자 목록</Typography>
          <List>
            {users.map(user => (
              <ListItem key={user.id}>
                <ListItemText primary={user.name} secondary={user.email} />
                <Chip label={user.role} color={user.role === "ADMIN" ? "error" : user.role === "TEACHER" ? "primary" : "default"} sx={{ mr: 2 }} />
                {/* 역할 변경 UI: 본인(관리자) 계정은 변경 불가 */}
                {user.role !== "ADMIN" && (
                  editRoleId === user.id ? (
                    <>
                      <Select
                        size="small"
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as "STUDENT"|"TEACHER"|"ADMIN")}
                        sx={{ minWidth: 100, mr: 1 }}
                      >
                        <MenuItem value="STUDENT">학생</MenuItem>
                        <MenuItem value="TEACHER">교사</MenuItem>
                      </Select>
                      <Chip label="저장" color="success" clickable sx={{ mr: 1 }} onClick={() => handleRoleChange(user.id, editRole)} />
                      <Chip label="취소" color="default" clickable onClick={() => setEditRoleId(null)} />
                    </>
                  ) : (
                    <Chip label="역할 변경" color="info" clickable onClick={() => { setEditRoleId(user.id); setEditRole(user.role); }} />
                  )
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
