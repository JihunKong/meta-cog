import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // 요청 본문에서 데이터 추출
    const { teacherId, sessionId, feedback } = await req.json();
    
    if (!teacherId || !sessionId || !feedback) {
      return NextResponse.json({ 
        success: false,
        error: '교사 ID, 세션 ID, 피드백 내용이 모두 필요합니다' 
      }, { status: 400 });
    }
    
    // 교사 권한 확인
    const db = getFirebaseAdminFirestore();
    const teacherDoc = await db.collection('users').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return NextResponse.json({ 
        success: false,
        error: '교사 정보를 찾을 수 없습니다' 
      }, { status: 404 });
    }
    
    const teacherData = teacherDoc.data();
    if (teacherData?.role !== 'teacher') {
      return NextResponse.json({ 
        success: false,
        error: '교사 권한이 없습니다' 
      }, { status: 403 });
    }
    
    // 세션 존재 여부 확인
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      return NextResponse.json({ 
        success: false,
        error: '세션을 찾을 수 없습니다' 
      }, { status: 404 });
    }
    
    // 세션에 피드백 추가
    await db.collection('sessions').doc(sessionId).update({
      teacher_feedback: feedback,
      feedback_by: teacherId,
      feedback_teacher_name: teacherData.name || '',
      feedback_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ 
      success: true,
      message: '피드백이 성공적으로 추가되었습니다'
    });
  } catch (error: any) {
    console.error(`교사 피드백 추가 API 오류:`, error);
    return NextResponse.json({ 
      success: false,
      error: error.message || '피드백 추가 중 오류가 발생했습니다' 
    }, { status: 500 });
  }
}
