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
    // Firestore에서 사용자 정보 조회
    const db = getFirebaseAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ name: null }, { status: 200 });
    }
    
    const userData = userDoc.data();
    const name = userData?.name || null;
    
    return NextResponse.json({ name });
  } catch (error: any) {
    console.error(`사용자 이름 조회 API 오류:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
