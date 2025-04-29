"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Chip, MenuItem, Select, Button, CircularProgress, TextField, FormControl, InputLabel, Tabs, Tab } from "@mui/material";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseInstance } from "@/lib/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  getDoc, 
  updateDoc,
  where,
  orderBy
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

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
  // --- Custom Claims Debug Logging ---
  React.useEffect(() => {
    // Modular SDK: import { getAuth } from "firebase/auth";
    try {
      const { getAuth } = require("firebase/auth");
      const auth = getAuth();
      if (auth.currentUser) {
        auth.currentUser.getIdTokenResult().then((res: any) => {
          console.log("[DEBUG] Firebase Custom Claims:", res.claims);
        });
      } else {
        console.log("[DEBUG] No current user detected for custom claims check.");
      }
    } catch (e) {
      console.log("[DEBUG] Custom claims check failed:", e);
    }
  }, []);

  // --- Admin Profiles Collection Patch ---
  React.useEffect(() => {
    // Only run if this is the admin user
    const adminEmail = "purusil55@gmail.com";
    const { db, auth } = getFirebaseInstance();
    if (auth.currentUser && auth.currentUser.email === adminEmail) {
      const uid = auth.currentUser.uid;
      const profileRef = doc(db, "users", uid); // users 컬렉션, uid를 문서 ID로 사용
      setDoc(profileRef, {
        email: adminEmail,
        role: "admin",
        display_name: "관리자",
        updated_at: new Date(),
      }, { merge: true })
        .then(() => console.log("[DEBUG] Admin profile document created/updated in 'users' collection with UID as ID."))
        .catch((e: any) => console.error("[DEBUG] Failed to create/update admin profile:", e));
    }
  }, []);

  // --- Custom Claims Debug Logging ---
  // This useEffect will log the current user's custom claims to the console
  // for debugging admin claim propagation issues.
  React.useEffect(() => {
    // Modular SDK: import { getAuth } from "firebase/auth";
    try {
      const { getAuth } = require("firebase/auth");
      const auth = getAuth();
      if (auth.currentUser) {
        auth.currentUser.getIdTokenResult().then(res => {
          console.log("[DEBUG] Firebase Custom Claims:", res.claims);
        });
      } else {
        console.log("[DEBUG] No current user detected for custom claims check.");
      }
    } catch (e) {
      console.log("[DEBUG] Custom claims check failed:", e);
    }
  }, []);

  // 사용자 목록 상태 및 관련 함수 완전 삭제 (Firestore list 권한 미지원)
// const [users, setUsers] = useState<User[]>([]);
// const fetchUsers = async () => { /* ... */ }
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"STUDENT"|"TEACHER"|"ADMIN">("STUDENT");

  // [설명] 사용자 추가를 위한 입력값 state입니다.
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState(""); // 비밀번호 필드 추가
  // 탭 상태: 'student' 또는 'teacher'
  const [addTab, setAddTab] = useState<'student'|'teacher'>('student');
  const [addingUser, setAddingUser] = useState(false); // 사용자 추가 진행 상태
  
  // 인증 관련 상태
  const [role, setRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false); // 인증 확인 완료 여부
  const [authError, setAuthError] = useState<string | null>(null); // 인증 오류 메시지
  const router = useRouter();

  // 사용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setUsers([]); // 기존 데이터 초기화
      
      const { db } = getFirebaseInstance();
      
      // 전체 사용자 목록과 학생 이름 목록을 불러오는 코드는 list 권한이 없어 동작하지 않음
      // 대신, 단일 사용자 문서만 get 할 수 있습니다.
      // 예시: 특정 사용자 ID로만 조회
      // const userRef = doc(db, "users", "USER_ID");
      // const userSnap = await getDoc(userRef);
      // if (userSnap.exists()) { ... }
      // setUsers([...]);
      // 아래 코드는 list 권한이 필요하므로 주석 처리
      // const usersRef = collection(db, "users");
      // const usersQuery = query(usersRef, orderBy("created_at", "desc"));
      // const usersSnapshot = await getDocs(usersQuery);
      // ...
      // setUsers([]); // 사용자 목록 상태도 사용하지 않음
      // 학생 이름 정보도 마찬가지로 전체 목록 불가
      // const studentNamesRef = collection(db, "student_names");
      // const studentNamesSnapshot = await getDocs(studentNamesRef);
      // ...
    } catch (error: any) {
      console.error('사용자 데이터 로드 오류:', error.message);
    }
  };

  // 역할별로 분리된 사용자 추가 함수
  // Helper to sanitize email for Firestore document ID (teacher_profiles 등에서 사용)
function sanitizeEmailForDocId(email: string): string {
  // Replace @ and . with _
  return email.replace(/[@.]/g, '_');
}

const handleAddUserWithRole = async (role: 'student'|'teacher') => {
  if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
    alert('이름, 이메일, 비밀번호를 모두 입력해주세요.');
    return;
  }
  setAddingUser(true);
  try {
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        role,
        name: newName,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert('사용자 계정이 성공적으로 생성되었습니다!');
      // 필요하다면 fetchUsers() 등 추가 작업
      setNewName("");
      setNewEmail("");
      setNewPassword("");
    } else {
      alert('계정 생성 오류: ' + data.error);
    }
  } catch (err: any) {
    alert('API 호출 오류: ' + (err?.message || JSON.stringify(err)));
  } finally {
    setAddingUser(false);
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
          router.replace("/login");
          return;
        }
        
        // admin 역할인 경우만 상태 업데이트
        setRole(r);
        setAuthChecked(true); // 인증 확인 완료
        console.log('Admin dashboard - Auth success, 사용자 목록 기능 없음');
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



  // 역할 변경 핸들러 - 실제 Firebase 데이터 업데이트
  const handleRoleChange = async (id: string, newRole: "STUDENT"|"TEACHER"|"ADMIN") => {
    try {
      const { db } = getFirebaseInstance();
      
      // users 컬렉션의 사용자 문서 업데이트
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, { 
        role: newRole.toLowerCase() // 소문자로 저장
      });
      
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
  if (!role || role !== undefined && role !== "admin") {
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
      
      {/* 전체 사용자 목록 및 역할 - Firestore list 권한 미지원으로 삭제됨 */}
      
      <Card sx={{ mt: 2 }}>
        <CardContent>
          {/* 사용자 추가 폼 */}
          <Box sx={{ mb: 4 }}>
            <Tabs value={addTab} onChange={(_, v) => setAddTab(v)} sx={{ mb: 2 }}>
              <Tab label="학생 계정 생성" value="student" />
              <Tab label="교사 계정 생성" value="teacher" />
            </Tabs>
            {addTab === 'student' && (
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="h6">학생 계정 생성</Typography>
                <TextField label="이름" value={newName} onChange={e => setNewName(e.target.value)} fullWidth sx={{ mb: 1 }} />
                <TextField label="이메일" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} fullWidth sx={{ mb: 1 }} />
                <TextField label="비밀번호" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth sx={{ mb: 1 }} />
                <Button variant="contained" onClick={() => handleAddUserWithRole('student')} disabled={addingUser} sx={{ mt: 1 }}>
                  {addingUser ? (<><CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />추가 중...</>) : '학생 계정 추가'}
                </Button>
              </Box>
            )}
            {addTab === 'teacher' && (
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="h6">교사 계정 생성</Typography>
                <TextField label="이름" value={newName} onChange={e => setNewName(e.target.value)} fullWidth sx={{ mb: 1 }} />
                <TextField label="이메일" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} fullWidth sx={{ mb: 1 }} />
                <TextField label="비밀번호" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth sx={{ mb: 1 }} />
                <Button variant="contained" onClick={() => handleAddUserWithRole('teacher')} disabled={addingUser} sx={{ mt: 1 }}>
                  {addingUser ? (<><CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />추가 중...</>) : '교사 계정 추가'}
                </Button>
              </Box>
            )}
          </Box>
          
          {/* 사용자 목록 및 역할 변경 UI - Firestore list 권한 미지원으로 전체 삭제됨 */}
          <Typography variant="h6">사용자 목록</Typography>
          <List>
            {/* 사용자 목록 및 역할 변경 UI - Firestore list 권한 미지원으로 전체 삭제됨 */}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
