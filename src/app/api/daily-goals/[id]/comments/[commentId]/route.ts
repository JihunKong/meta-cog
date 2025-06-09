import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const body = await request.json();
    const goalId = params.id;
    const commentId = params.commentId;
    const { userId } = body;

    if (!goalId || !commentId || !userId) {
      return NextResponse.json(
        { error: '목표 ID, 댓글 ID, 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 댓글 존재 확인
    const commentRef = firestore.collection('dailyGoalComments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();

    // 권한 확인 (작성자만 삭제 가능)
    if (commentData?.userId !== userId) {
      return NextResponse.json(
        { error: '댓글 삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 삭제
    await commentRef.delete();

    // 목표의 댓글 수 감소
    const goalRef = firestore.collection('dailyGoals').doc(goalId);
    const goalDoc = await goalRef.get();
    
    if (goalDoc.exists) {
      const currentCount = goalDoc.data()?.commentCount || 0;
      await goalRef.update({
        commentCount: Math.max(0, currentCount - 1),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return NextResponse.json(
      { error: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}