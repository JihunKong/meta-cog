import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const goalId = params.id;

    if (!userId || !goalId) {
      return NextResponse.json(
        { error: '사용자 ID와 목표 ID가 필요합니다.' },
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

    const goalData = goalDoc.data();
    
    if (goalData?.userId !== userId) {
      return NextResponse.json(
        { error: '본인의 목표만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    const batch = firestore.batch();

    batch.delete(goalRef);

    const supportSnapshot = await firestore
      .collection('dailyGoalSupports')
      .where('goalId', '==', goalId)
      .get();
    
    supportSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const commentSnapshot = await firestore
      .collection('dailyGoalComments')
      .where('goalId', '==', goalId)
      .get();
    
    commentSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: '목표가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('목표 삭제 오류:', error);
    return NextResponse.json(
      { error: '목표 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}