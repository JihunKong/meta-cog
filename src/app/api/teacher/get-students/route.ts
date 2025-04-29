import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore, getFirebaseAdminAuth } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // URL에서 teacher_id 쿼리 파라미터 추출
    const url = new URL(req.url);
    const teacherId = url.searchParams.get('teacher_id');
    
    if (!teacherId) {
      return NextResponse.json({ 
        error: '교사 ID가 필요합니다' 
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
    
    // 학생 목록 조회 (users 컬렉션에서 role이 'student'인 문서 조회)
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();
    
    // 학생 데이터 타입 정의
    interface StudentData {
      id: string;
      email: string;
      name: string;
      school?: string;
      grade?: string;
      classNum?: string;
      studentNum?: string;
    }
    
    const students: StudentData[] = [];
    
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      students.push({
        id: doc.id,
        email: data.email || '',
        name: data.name || '',
        school: data.school || '',
        grade: data.grade || '',
        classNum: data.classNum || '',
        studentNum: data.studentNum || ''
      });
    });
    
    return NextResponse.json({ students });
  } catch (error: any) {
    console.error(`교사용 학생 목록 조회 API 오류:`, error);
    return NextResponse.json({ 
      error: error.message || '학생 목록 조회 중 오류가 발생했습니다' 
    }, { status: 500 });
  }
}
