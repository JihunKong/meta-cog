"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Chip, MenuItem, Select } from "@mui/material";

interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"STUDENT"|"TEACHER"|"ADMIN">("STUDENT");

  // [설명] 사용자 추가를 위한 입력값 state입니다.
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"STUDENT"|"TEACHER"|"ADMIN">("STUDENT");

  // [설명] '추가' 버튼 클릭 시 실행되는 함수입니다. 입력값으로 새 사용자를 users에 추가합니다.
  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setUsers(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2,10), name: newName, email: newEmail, role: newRole }
    ]);
    setNewName(""); setNewEmail(""); setNewRole("STUDENT");
  };

  useEffect(() => {
    // TODO: 실제 Supabase에서 사용자 데이터 fetch
    setUsers([
      { id: "1", email: "student1@email.com", name: "홍길동", role: "STUDENT" },
      { id: "2", email: "teacher1@email.com", name: "이선생", role: "TEACHER" },
      { id: "3", email: "admin@email.com", name: "관리자", role: "ADMIN" },
      { id: "4", email: "student2@email.com", name: "김영희", role: "STUDENT" },
    ]);
  }, []);

  // 역할 변경 핸들러(더미)
  const handleRoleChange = (id: string, newRole: "STUDENT"|"TEACHER"|"ADMIN") => {
    setUsers(prev => prev.map(u => u.id===id ? { ...u, role: newRole } : u));
    setEditRoleId(null);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>관리자 대시보드</Typography>
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
              onChange={e => setNewRole(e.target.value as "STUDENT"|"TEACHER"|"ADMIN")}
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="STUDENT">STUDENT</MenuItem>
              <MenuItem value="TEACHER">TEACHER</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
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
