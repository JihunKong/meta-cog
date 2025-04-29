import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// Helper to sanitize email for Firestore document ID (teacher_profiles 등에서 사용)
function sanitizeEmailForDocId(email: string): string {
  // Replace @ and . with _
  return email.replace(/[@.]/g, '_');
}

export async function POST(req: NextRequest) {
  const { email, password, role, name } = await req.json();
  
  try {
    // 각 서비스 인스턴스 직접 가져오기
    const auth = getFirebaseAdminAuth();
    const db = getFirebaseAdminFirestore();
    
    // 1. Authentication 사용자 생성
    const userRecord = await auth.createUser({ email, password });

    // 2. Firestore users 컬렉션에 정보 저장
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      classNum: '',
      grade: '',
      school: '',
      studentNum: '',
    });
    
    // 3. 학생인 경우 student_names 컬렉션에도 추가
    if (role === 'student') {
      await db.collection('student_names').doc(email).set({
        email,
        display_name: name,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // 4. 교사인 경우 teacher_profiles 컬렉션에도 추가
    if (role === 'teacher') {
      // Sanitize email for Firestore doc ID
      const safeEmailId = sanitizeEmailForDocId(email);
      await db.collection('teacher_profiles').doc(safeEmailId).set({
        email,
        display_name: name,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error('API 계정 생성 오류:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
