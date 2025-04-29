'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Container, CircularProgress, Alert, Paper, Grid, 
  TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { getFirebaseInstance } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, setDoc, collection, getDocs, query } from 'firebase/firestore';
import LogoutButton from '@/components/LogoutButton';

// 임시 학교 목록 (로그인 페이지와 동일하게 사용, 추후 API 연동 필요)
const schoolList = ["완도고등학교", "금성고등학교"];

// 사용자 정보 타입 정의 (목록 표시에 사용)
interface Profile {
  id: string;
  email: string;
  name: string;
  school: string;
  role: string;
  grade?: string;
  classNum?: string;
  studentNum?: string;
  created_at?: string; // 필요에 따라 추가
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // --- 사용자 생성 폼 상태 --- 
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createSchool, setCreateSchool] = useState("");
  const [createRole, setCreateRole] = useState('student'); // 기본값 student
  const [createGrade, setCreateGrade] = useState("");
  const [createClass, setCreateClass] = useState("");
  const [createNumber, setCreateNumber] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  // --- --- --- --- --- --- ---

  // --- 사용자 목록 상태 --- 
  const [userList, setUserList] = useState<Profile[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  // --- --- --- --- --- --- 

  // --- 사용자 목록 조회 함수 ---
  const fetchUsers = async () => {
    setListLoading(true);
    setListError("");
    setUserList([]);
    try {
      const { db } = getFirebaseInstance();
      const profilesCollection = collection(db, 'Profiles');
      const q = query(profilesCollection); // 필요시 정렬 등 추가 가능: query(profilesCollection, orderBy("created_at", "desc"))
      const querySnapshot = await getDocs(q);
      
      const fetchedUsers: Profile[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as Profile);
      });
      setUserList(fetchedUsers);
      console.log('Admin: 사용자 목록 조회 성공:', fetchedUsers.length, '명');
    } catch (error: any) {
      console.error('Admin: 사용자 목록 조회 오류:', error);
      setListError('사용자 목록을 불러오는 중 오류가 발생했습니다. Firestore 권한 규칙을 확인하세요.');
    }
    setListLoading(false);
  };
  // --- --- --- --- --- --- ---

  useEffect(() => {
    const { auth } = getFirebaseInstance();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          console.log('Admin Page - User Claims:', idTokenResult.claims);
          if (idTokenResult.claims.admin === true) {
            setIsAdmin(true);
            console.log('관리자 접근 승인됨');
            // 관리자 확인 후 사용자 목록 조회 시작
            fetchUsers(); 
          } else {
            console.log('관리자 권한 없음, 리디렉션...');
            router.replace('/login'); 
          }
        } catch (error) {
          console.error('커스텀 클레임 확인 중 오류:', error);
          router.replace('/login');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        console.log('로그인 필요, 리디렉션...');
        router.replace('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // --- 사용자 생성 핸들러 (Callable Function 호출로 변경) ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");

    // 기본 유효성 검사
    if (!createEmail || !createPassword || !createName || !createSchool || !createRole) {
      setCreateError("이메일, 비밀번호, 이름, 학교, 역할은 필수 항목입니다.");
      setCreateLoading(false);
      return;
    }
    if (createRole === 'student' && (!createGrade || !createClass || !createNumber)) {
      setCreateError("학생 역할은 학년, 반, 번호가 필수입니다.");
      setCreateLoading(false);
      return;
    }
    if (!schoolList.includes(createSchool)) {
      setCreateError("유효한 학교를 선택해주세요.");
      setCreateLoading(false);
      return;
    }

    try {
      // Firebase Functions 인스턴스 가져오기
      const functions = getFunctions(getFirebaseInstance().app);
      // Callable function 참조
      const createUserAdminFunc = httpsCallable(functions, 'createUserByAdmin');

      // 함수에 전달할 데이터 준비
      const requestData = {
        email: createEmail,
        password: createPassword,
        name: createName,
        school: createSchool,
        role: createRole,
        // 학생 정보는 역할이 student일 때만 포함 (함수 내에서도 검사하지만, 명시적으로 전달)
        ...(createRole === 'student' && {
          grade: createGrade,
          classNum: createClass,
          studentNum: createNumber,
        })
      };

      console.log("Admin: Calling createUserByAdmin function with data:", requestData);

      // Callable function 호출
      const result: any = await createUserAdminFunc(requestData);

      console.log("Admin: Callable function result:", result);

      // 함수 결과 처리 (함수에서 정의한 success 필드 확인)
      if (result.data.success) {
        setCreateSuccess(result.data.message || `사용자(${createEmail}) 생성이 완료되었습니다.`);
        // 폼 초기화
        setCreateEmail("");
        setCreatePassword("");
        setCreateName("");
        setCreateSchool("");
        setCreateRole('student');
        setCreateGrade("");
        setCreateClass("");
        setCreateNumber("");
        // 사용자 생성 성공 후 목록 새로고침
        await fetchUsers();
      } else {
        // 함수 자체는 성공했으나, 로직상 실패 (거의 발생 안 함)
        setCreateError(result.data.message || "함수 실행 중 오류가 발생했습니다.");
      }

    } catch (error: any) {
      console.error('Admin: Callable function 호출 오류:', error);
      // HttpsError의 경우, 함수에서 throw한 메시지를 사용
      setCreateError(error.message || '사용자 생성 중 오류가 발생했습니다.');
    }
    setCreateLoading(false);
  };
  // --- --- --- --- --- --- ---

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="error">
          접근 권한이 없습니다. 관리자 계정으로 로그인하세요.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">관리자 대시보드</Typography>
        <LogoutButton />
      </Box>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 4 }}>
        환영합니다, 관리자님! (사용자: {user?.email})
      </Typography>

      {/* --- 사용자 생성 폼 --- */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>사용자 생성</Typography>
        <form onSubmit={handleCreateUser}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="이메일" type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} fullWidth required variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="비밀번호" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} fullWidth required variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="이름" value={createName} onChange={(e) => setCreateName(e.target.value)} fullWidth required variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel id="school-select-label">학교</InputLabel>
                <Select
                  labelId="school-select-label"
                  value={createSchool}
                  onChange={(e) => setCreateSchool(e.target.value)}
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel id="role-select-label">역할</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  label="역할"
                >
                  <MenuItem value="student">학생</MenuItem>
                  <MenuItem value="teacher">교사</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* 학생 역할 선택 시에만 표시 */}
            {createRole === 'student' && (
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={4}>
                  <TextField label="학년" type="number" value={createGrade} onChange={(e) => setCreateGrade(e.target.value)} fullWidth required variant="outlined" size="small" />
                </Grid>
                <Grid item xs={4}>
                  <TextField label="반" type="number" value={createClass} onChange={(e) => setCreateClass(e.target.value)} fullWidth required variant="outlined" size="small" />
                </Grid>
                <Grid item xs={4}>
                  <TextField label="번호" type="number" value={createNumber} onChange={(e) => setCreateNumber(e.target.value)} fullWidth required variant="outlined" size="small" />
                </Grid>
              </Grid>
            )}
            {createRole === 'teacher' && (
                <Grid item xs={12}>
                    <FormHelperText sx={{ml: 1}}>교사 계정은 학년, 반, 번호 정보가 필요하지 않습니다.</FormHelperText>
                </Grid>
            )}

            <Grid item xs={12}>
              {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
              {createSuccess && <Alert severity="success" sx={{ mb: 2 }}>{createSuccess}</Alert>}
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={createLoading}>
                {createLoading ? <CircularProgress size={24} color="inherit" /> : "사용자 생성"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      {/* --- --- --- --- --- */}
      
      {/* --- 사용자 목록 표시 --- */}
      <Paper sx={{ p: 3, mb: 4 }}>
         <Typography variant="h6" gutterBottom>사용자 목록</Typography>
         {listLoading && <CircularProgress size={24} sx={{ display: 'block', margin: 'auto' }} />}
         {listError && <Alert severity="error">{listError}</Alert>}
         {!listLoading && !listError && (
           <TableContainer>
             <Table stickyHeader size="small">
               <TableHead>
                 <TableRow>
                   <TableCell>이메일</TableCell>
                   <TableCell>이름</TableCell>
                   <TableCell>학교</TableCell>
                   <TableCell>역할</TableCell>
                   <TableCell>학년</TableCell>
                   <TableCell>반</TableCell>
                   <TableCell>번호</TableCell>
                   {/* 필요시 액션 버튼 추가 */} 
                 </TableRow>
               </TableHead>
               <TableBody>
                 {userList.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={7} align="center">사용자 데이터가 없습니다.</TableCell>
                   </TableRow>
                 ) : (
                   userList.map((profile) => (
                     <TableRow key={profile.id} hover>
                       <TableCell>{profile.email}</TableCell>
                       <TableCell>{profile.name}</TableCell>
                       <TableCell>{profile.school}</TableCell>
                       <TableCell>{profile.role}</TableCell>
                       <TableCell>{profile.role === 'student' ? profile.grade : '-'}</TableCell>
                       <TableCell>{profile.role === 'student' ? profile.classNum : '-'}</TableCell>
                       <TableCell>{profile.role === 'student' ? profile.studentNum : '-'}</TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </TableContainer>
         )}
       </Paper>
      {/* --- --- --- --- --- --- */}

      {/* --- 학교 관리 등 기타 기능 (구현 예정) --- */}
      <Paper sx={{ p: 3 }}>
         <Typography variant="h6" gutterBottom>기타 관리 기능</Typography>
         <Typography variant="body2" color="text.secondary">
           (학교 목록 관리 등 구현 예정)
         </Typography>
       </Paper>
      {/* --- --- --- --- --- --- --- --- */}
    </Container>
  );
} 