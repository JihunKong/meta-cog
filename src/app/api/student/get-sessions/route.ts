import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  // URL에서 user_id 쿼리 파라미터 추출
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ 
      error: '사용자 ID가 필요합니다' 
    }, { status: 400 });
  }
  
  try {
    // Firestore에서 학생 세션 데이터 조회
    const db = getFirebaseAdminFirestore();
    const sessionsRef = db.collection('sessions');
    const q = sessionsRef.where('user_id', '==', userId);
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
    
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error(`학생 세션 데이터 조회 API 오류:`, error);
    return NextResponse.json({ 
      error: error.message || '세션 데이터 조회 중 오류가 발생했습니다' 
    }, { status: 500 });
  }
}
