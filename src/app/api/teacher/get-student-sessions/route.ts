import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // URL에서 쿼리 파라미터 추출
    const url = new URL(req.url);
    const teacherId = url.searchParams.get('teacher_id');
    const studentId = url.searchParams.get('student_id');
    
    if (!teacherId || !studentId) {
      return NextResponse.json({ 
        error: '교사 ID와 학생 ID가 모두 필요합니다' 
      }, { status: 400 });
    }
    
    // 교사 권한 확인
    const db = getFirebaseAdminFirestore();
    const teacherDoc = await db.collection('users').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return NextResponse.json({ 
        error: '교사 정보를 찾을 수 없습니다' 
      }, { status: 404 });
    }
    
    const teacherData = teacherDoc.data();
    if (teacherData?.role !== 'teacher') {
      return NextResponse.json({ 
        error: '교사 권한이 없습니다' 
      }, { status: 403 });
    }
    
    // 학생 정보 확인
    const studentDoc = await db.collection('users').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ 
        error: '학생 정보를 찾을 수 없습니다' 
      }, { status: 404 });
    }
    
    const studentData = studentDoc.data();
    if (studentData?.role !== 'student') {
      return NextResponse.json({ 
        error: '유효한 학생 계정이 아닙니다' 
      }, { status: 400 });
    }
    
    // 학생의 세션 데이터 조회
    const sessionsRef = db.collection('sessions');
    const q = sessionsRef.where('user_id', '==', studentId);
    const querySnapshot = await q.get();
    
    // 세션 타입 정의
    interface SessionData {
      id: string;
      user_id: string;
      subject: string;
      description: string;
      percent: number;
      reflection: string;
      created_at: string;
      goal_progress_id?: string;
      progress_created_at?: any;
      teacher_feedback: string;
    }
    
    const sessions: SessionData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        user_id: data.user_id,
        subject: data.subject,
        description: data.description,
        percent: data.percent || 0,
        reflection: data.reflection || "",
        created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
        goal_progress_id: data.goal_progress_id,
        progress_created_at: data.progress_created_at,
        teacher_feedback: data.teacher_feedback || ''
      });
    });
    
    // 학생 기본 정보와 함께 세션 데이터 반환
    return NextResponse.json({ 
      student: {
        id: studentId,
        name: studentData.name || '',
        email: studentData.email || '',
        school: studentData.school || '',
        grade: studentData.grade || '',
        classNum: studentData.classNum || '',
        studentNum: studentData.studentNum || ''
      },
      sessions 
    });
  } catch (error: any) {
    console.error(`교사용 학생 세션 조회 API 오류:`, error);
    return NextResponse.json({ 
      error: error.message || '학생 세션 데이터 조회 중 오류가 발생했습니다' 
    }, { status: 500 });
  }
}
