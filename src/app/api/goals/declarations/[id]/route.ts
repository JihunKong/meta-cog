import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseInstance } from '@/lib/firebase';

interface RouteParams {
  params: {
    id: string;
  };
}

// 특정 목표 선언 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { db: firestore } = getFirebaseInstance();
    const { id } = params;

    const doc = await firestore.collection('goalDeclarations').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: '목표를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const data = doc.data();
    
    // 작성자 정보 조회
    const userDoc = await firestore.collection('users').doc(data.userId).get();
    const userData = userDoc.data();

    // 응원 목록 조회
    const supportsSnapshot = await firestore
      .collection('goalSupports')
      .where('goalId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();

    const supports = await Promise.all(supportsSnapshot.docs.map(async (supportDoc) => {
      const supportData = supportDoc.data();
      
      if (supportData.isAnonymous) {
        return {
          id: supportDoc.id,
          type: supportData.supportType,
          message: supportData.message,
          isAnonymous: true,
          createdAt: supportData.createdAt?.toDate?.() || supportData.createdAt
        };
      }

      // 응원자 정보 조회
      const supporterDoc = await firestore.collection('users').doc(supportData.supporterId).get();
      const supporterData = supporterDoc.data();

      return {
        id: supportDoc.id,
        type: supportData.supportType,
        message: supportData.message,
        supporter: {
          id: supportData.supporterId,
          name: supporterData?.name || '익명',
          school: supporterData?.school || ''
        },
        createdAt: supportData.createdAt?.toDate?.() || supportData.createdAt
      };
    }));

    // 진행 업데이트 조회
    const updatesSnapshot = await firestore
      .collection('goalUpdates')
      .where('goalId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const updates = updatesSnapshot.docs.map(updateDoc => {
      const updateData = updateDoc.data();
      return {
        id: updateDoc.id,
        ...updateData,
        createdAt: updateData.createdAt?.toDate?.() || updateData.createdAt
      };
    });

    const goal = {
      id: doc.id,
      ...data,
      author: {
        id: data.userId,
        name: userData?.name || '익명',
        school: userData?.school || ''
      },
      supports,
      updates,
      declaredAt: data.declaredAt?.toDate?.() || data.declaredAt,
      targetDate: data.targetDate?.toDate?.() || data.targetDate,
      deadlineTime: data.deadlineTime?.toDate?.() || data.deadlineTime,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      startedAt: data.startedAt?.toDate?.() || data.startedAt,
      completedAt: data.completedAt?.toDate?.() || data.completedAt
    };

    return NextResponse.json({
      success: true,
      goal
    });

  } catch (error) {
    console.error('목표 조회 오류:', error);
    return NextResponse.json(
      { error: '목표를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 목표 선언 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { db: firestore } = getFirebaseInstance();
    const { id } = params;
    const body = await request.json();

    const {
      userId,
      title,
      description,
      targetAmount,
      targetDate,
      deadlineTime,
      difficulty,
      isPublic,
      motivation,
      reward
    } = body;

    // 권한 확인
    const doc = await firestore.collection('goalDeclarations').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: '목표를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const currentData = doc.data();
    if (currentData.userId !== userId) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 진행 중이거나 완료된 목표는 제한적 수정만 가능
    if (currentData.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '완료된 목표는 수정할 수 없습니다.' },
        { status: 400 }
      );
    }

    const updates: any = {
      updatedAt: new Date()
    };

    // 수정 가능한 필드들
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (targetAmount !== undefined) updates.targetAmount = targetAmount;
    if (targetDate !== undefined) updates.targetDate = new Date(targetDate);
    if (deadlineTime !== undefined) updates.deadlineTime = deadlineTime ? new Date(deadlineTime) : null;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (motivation !== undefined) updates.motivation = motivation.trim();
    if (reward !== undefined) updates.reward = reward.trim();

    await firestore.collection('goalDeclarations').doc(id).update(updates);

    return NextResponse.json({
      success: true,
      message: '목표가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('목표 수정 오류:', error);
    return NextResponse.json(
      { error: '목표 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 목표 선언 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { db: firestore } = getFirebaseInstance();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 권한 확인
    const doc = await firestore.collection('goalDeclarations').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: '목표를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const currentData = doc.data();
    if (currentData.userId !== userId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 연관 데이터도 함께 삭제
    const batch = firestore.batch();
    
    // 목표 선언 삭제
    batch.delete(firestore.collection('goalDeclarations').doc(id));
    
    // 관련 응원 삭제
    const supportsSnapshot = await firestore
      .collection('goalSupports')
      .where('goalId', '==', id)
      .get();
    supportsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 관련 댓글 삭제
    const commentsSnapshot = await firestore
      .collection('goalComments')
      .where('goalId', '==', id)
      .get();
    commentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 관련 업데이트 삭제
    const updatesSnapshot = await firestore
      .collection('goalUpdates')
      .where('goalId', '==', id)
      .get();
    updatesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

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