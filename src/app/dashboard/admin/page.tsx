"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Chip, MenuItem, Select } from "@mui/material";
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
  // 역할을 소문자로 변경 (enum 형식에 맞춰서)
  const [newRole, setNewRole] = useState<"student"|"teacher"|"admin">("student");
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  // [설명] '추가' 버튼 클릭 시 실행되는 함수입니다. 입력값으로 새 사용자를 추가합니다.
  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
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
            role: newRole
          });
        
        if (userError) {
          console.error('User 테이블 삽입 오류:', userError);
          // User 테이블 오류는 무시하고 계속 진행
        }
      }
      
      // UI 업데이트 및 입력창 초기화
      fetchUsers();
      setNewName(""); 
      setNewEmail(""); 
      setNewRole("student"); // 소문자로 변경
    } catch (error: any) {
      console.error('사용자 추가 오류:', error.message);
      alert('사용자 추가 실패: ' + error.message);
    }
  };
  
  // 클라이언트에서 역할 검사 (SSR에서는 권한 분기하지 않음)
  useEffect(() => {
    // 사용자 인증 정보 확인 및 리디렉션
    let authCheckComplete = false;

    const checkAuth = async () => {
      try {
        console.log("Admin dashboard - Checking auth...");
        const r = await getUserRole();
        console.log('Admin dashboard - User role:', r); // 디버깅용 로그
        setRole(r);
        
        // 소문자 'admin'으로 비교 (enum 데이터베이스 타입에 맞추기)
        console.log('Admin dashboard - Role type check:', typeof r, r);
        if (r !== "admin") {
          console.log('Redirecting from admin dashboard - wrong role:', r);
          // router.replace 대신 직접 리디렉션 사용
          window.location.href = "/login";
          return;
        }
        
        // 인증 완료
        authCheckComplete = true;
        console.log('Admin dashboard - Auth success, fetching users');
        // ADMIN 권한이 있으면 사용자 데이터 가져오기
        fetchUsers();
      } catch (err) {
        console.error('Auth check error:', err);
        window.location.href = "/login";
      }
    };

    // 아직 인증 확인이 완료되지 않은 경우 진행
    if (!authCheckComplete) {
      checkAuth();
    }
    
    // 백업 타이머 - 5초 후에도 인증이 완료되지 않았으면 로그인 페이지로 이동
    const failsafeTimer = setTimeout(() => {
      if (!authCheckComplete) {
        console.log('Admin dashboard - Auth check timeout, redirecting to login');
        window.location.href = "/login";
      }
    }, 5000);
    
    return () => clearTimeout(failsafeTimer);
  }, []);

  // 초기 데이터 로드 (별도 useEffect로 분리)
  useEffect(() => {
    if (role === "ADMIN") {
      fetchUsers();
    }
  }, [role]);

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
        role: profile.role as "STUDENT" | "TEACHER" | "ADMIN" || 'STUDENT'
      }));
      
      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('사용자 데이터 로드 오류:', error.message);
    }
  };
  
  // 초기 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 역할 변경 핸들러 - 실제 Supabase 데이터 업데이트
  const handleRoleChange = async (id: string, newRole: "STUDENT"|"TEACHER"|"ADMIN") => {
    try {
      // Supabase 프로필 테이블 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
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

  // 역할에 따른 조건부 렌더링
  return role !== "ADMIN" ? null : (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>관리자 대시보드</Typography>
        <LogoutButton />
      </Box>
      <Typography variant="subtitle1" gutterBottom>전체 사용자 목록 및 역할</Typography>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6">사용자 목록</Typography>
          {/* [설명] 아래는 사용자 추가 입력창입니다. 이름, 이메일, 역할을 입력하고 '추가'를 누르면 목록에 바로 반영됩니다. */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <input
              style={{ width: 120, padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
              placeholder="이름"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              style={{ width: 180, padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
              placeholder="이메일"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
            <Select
              size="small"
              value={newRole}
              onChange={e => setNewRole(e.target.value as "student"|"teacher"|"admin")}
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="student">STUDENT</MenuItem>
              <MenuItem value="teacher">TEACHER</MenuItem>
              <MenuItem value="admin">ADMIN</MenuItem>
            </Select>
            <Chip label="추가" color="primary" clickable onClick={handleAddUser} sx={{ cursor: 'pointer' }} />
          </Box>
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
                        <MenuItem value="STUDENT">STUDENT</MenuItem>
                        <MenuItem value="TEACHER">TEACHER</MenuItem>
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
          {/* 실제 데이터 연동 시 Supabase RLS(행 수준 보안) 정책을 반드시 적용해야 합니다! */}
          {/* 예: 학생은 본인 데이터만 SELECT/UPDATE, 교사/관리자는 전체 SELECT 등 */}
          {/* 예시 정책:
          CREATE POLICY "Students can view only their own records" ON goal_table FOR SELECT USING (auth.uid() = user_id);
          CREATE POLICY "Teachers can view all" ON goal_table FOR SELECT USING (EXISTS (SELECT 1 FROM user_table WHERE id = auth.uid() AND role = 'TEACHER'));
          */}
        </CardContent>
      </Card>
    </Box>
  );
}
