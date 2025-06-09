import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const body = await request.json();
    
    const { goalId, userId } = body;

    if (!goalId || !userId) {
      return NextResponse.json(
        { error: '목표 ID와 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const goalRef = firestore.collection('dailyGoals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return NextResponse.json(
        { error: '목표를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const supportQuery = await firestore
      .collection('dailyGoalSupports')
      .where('goalId', '==', goalId)
      .where('userId', '==', userId)
      .get();

    if (!supportQuery.empty) {
      await supportQuery.docs[0].ref.delete();
      
      await goalRef.update({
        supportCount: (goalDoc.data()?.supportCount || 1) - 1,
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: '응원을 취소했습니다.'
      });
    } else {
      await firestore.collection('dailyGoalSupports').add({
        goalId,
        userId,
        createdAt: new Date()
      });

      await goalRef.update({
        supportCount: (goalDoc.data()?.supportCount || 0) + 1,
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        message: '응원했습니다!'
      });
    }

  } catch (error) {
    console.error('목표 응원 오류:', error);
    return NextResponse.json(
      { error: '응원 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}