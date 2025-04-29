import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  // URL에서 user_id 쿼리 파라미터 추출
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
  }
  
  console.log(`get-role API: 사용자 ID ${userId}의 역할 조회 시도`);
  
  try {
    // Firestore에서 사용자 프로필 조회
    const db = getFirebaseAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`get-role API: 사용자 ID ${userId}의 프로필을 찾을 수 없음`);
      return NextResponse.json({ error: '사용자 프로필을 찾을 수 없습니다' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const role = userData?.role || null;
    
    console.log(`get-role API: 사용자 ID ${userId}의 역할 조회 성공: ${role}`);
    return NextResponse.json({ role });
  } catch (error: any) {
    console.error(`get-role API 오류:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
