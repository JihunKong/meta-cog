import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// 학생 정보 타입 정의
interface StudentInfo {
  name: string;
  school: string;
  grade: string;
  classNum: string;
  studentNum: string;
}

export async function POST(req: NextRequest) {
  try {
    // 요청 본문에서 데이터 추출
    const { email, password, studentInfo } = await req.json();
    
    if (!email || !password || !studentInfo) {
      return NextResponse.json({ 
        success: false, 
        error: '이메일, 비밀번호, 학생 정보가 필요합니다.' 
      }, { status: 400 });
    }
    
    // Firebase Admin 인스턴스 가져오기
    const auth = getFirebaseAdminAuth();
    const db = getFirebaseAdminFirestore();
    const safeRole = 'student'; // 역할은 항상 student로 고정
    
    // 1. Firebase Authentication에 사용자 생성
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: studentInfo.name
    });
    
    // 2. Firestore users 컬렉션에 사용자 정보 저장
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role: safeRole,
      name: studentInfo.name,
      school: studentInfo.school,
      grade: studentInfo.grade,
      classNum: studentInfo.classNum,
      studentNum: studentInfo.studentNum,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 3. student_names 컬렉션에도 추가
    await db.collection('student_names').doc(email).set({
      email,
      display_name: studentInfo.name,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        role: safeRole,
        name: studentInfo.name
      }
    });
  } catch (error: any) {
    console.error('회원가입 API 오류:', error);
    
    // 이메일 중복 오류 처리
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json({ 
        success: false, 
        error: '이미 사용 중인 이메일입니다.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || '회원가입 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
