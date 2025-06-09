import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const goalId = params.id;

    if (!goalId) {
      return NextResponse.json(
        { error: '목표 ID가 필요합니다.' },
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

    const commentsSnapshot = await firestore
      .collection('dailyGoalComments')
      .where('goalId', '==', goalId)
      .orderBy('createdAt', 'asc')
      .get();

    const comments = await Promise.all(commentsSnapshot.docs.map(async (doc) => {
      const commentData = doc.data();
      
      const userDoc = await firestore.collection('users').doc(commentData.userId).get();
      const userData = userDoc.data();

      return {
        id: doc.id,
        userId: commentData.userId,
        content: commentData.content,
        author: {
          name: userData?.name || '익명',
          school: userData?.school || ''
        },
        createdAt: commentData.createdAt?.toDate?.() || commentData.createdAt
      };
    }));

    return NextResponse.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error('댓글 조회 오류:', error);
    return NextResponse.json(
      { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const body = await request.json();
    const goalId = params.id;
    
    const { userId, content } = body;

    if (!goalId || !userId || !content?.trim()) {
      return NextResponse.json(
        { error: '목표 ID, 사용자 ID, 댓글 내용이 필요합니다.' },
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

    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const comment = {
      goalId,
      userId,
      content: content.trim(),
      createdAt: new Date()
    };

    await firestore.collection('dailyGoalComments').add(comment);

    await goalRef.update({
      commentCount: (goalDoc.data()?.commentCount || 0) + 1,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: '댓글이 작성되었습니다.'
    });

  } catch (error) {
    console.error('댓글 작성 오류:', error);
    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}