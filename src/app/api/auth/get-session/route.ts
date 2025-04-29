import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  // URL에서 user_id 쿼리 파라미터 추출
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
  }
  
  try {
    // Firestore에서 사용자 세션 데이터 조회
    const db = getFirebaseAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ 
        session: null,
        error: '사용자 데이터를 찾을 수 없습니다' 
      }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // 필요한 세션 데이터만 클라이언트에 반환
    const sessionData = {
      id: userId,
      email: userData?.email || null,
      role: userData?.role || null,
      name: userData?.name || null,
      // 필요한 경우 추가 필드 포함
    };
    
    return NextResponse.json({ session: sessionData });
  } catch (error: any) {
    console.error(`세션 데이터 조회 API 오류:`, error);
    return NextResponse.json({ 
      session: null,
      error: error.message || '세션 데이터 조회 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}
