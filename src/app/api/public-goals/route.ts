import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

// 공개 목표 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('공개 목표 API 시작');
    const firestore = getFirebaseAdminFirestore();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'all'; // all, my, school, promoted
    const subject = searchParams.get('subject');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('파라미터:', { userId, filter, subject, status, limit, offset });

    let query = firestore.collection('publicGoals').where('isVisible', '==', true);

    // 사용자 정보 조회 (필터링에 필요)
    let userData = null;
    if (userId) {
      const userDoc = await firestore.collection('users').doc(userId).get();
      userData = userDoc.exists ? userDoc.data() : null;
    }

    // 필터 적용
    switch (filter) {
      case 'my':
        if (!userId) {
          return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }
        query = query.where('authorId', '==', userId);
        break;
      case 'school':
        if (userData?.school) {
          query = query.where('authorSchool', '==', userData.school);
        }
        break;
      case 'promoted':
        query = query.where('isPromoted', '==', true);
        break;
      case 'active':
        query = query.where('status', 'in', ['DECLARED', 'IN_PROGRESS']);
        break;
      case 'completed':
        query = query.where('status', '==', 'COMPLETED');
        break;
      default:
        // all - 추가 필터 없음
        break;
    }

    // 추가 필터
    if (subject) {
      query = query.where('subject', '==', subject);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    // 정렬 및 페이징
    query = query.orderBy('declaredAt', 'desc');

    if (offset > 0) {
      // 오프셋 구현을 위해 제한적 방식 사용
      const offsetQuery = query.limit(offset + limit);
      const snapshot = await offsetQuery.get();
      const allDocs = snapshot.docs;
      const paginatedDocs = allDocs.slice(offset, offset + limit);
      
      const goals = paginatedDocs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        declaredAt: doc.data().declaredAt?.toDate?.() || doc.data().declaredAt,
        targetDate: doc.data().targetDate?.toDate?.() || doc.data().targetDate,
        startedAt: doc.data().startedAt?.toDate?.() || doc.data().startedAt,
        completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));

      return NextResponse.json({
        success: true,
        goals,
        hasMore: allDocs.length > offset + limit,
        total: allDocs.length
      });
    } else {
      query = query.limit(limit);
      const snapshot = await query.get();

      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        declaredAt: doc.data().declaredAt?.toDate?.() || doc.data().declaredAt,
        targetDate: doc.data().targetDate?.toDate?.() || doc.data().targetDate,
        startedAt: doc.data().startedAt?.toDate?.() || doc.data().startedAt,
        completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));

      console.log(`조회된 공개 목표 수: ${goals.length}`);

      return NextResponse.json({
        success: true,
        goals,
        hasMore: snapshot.docs.length === limit,
        filter,
        userSchool: userData?.school || null
      });
    }

  } catch (error) {
    console.error('공개 목표 조회 오류:', error);
    return NextResponse.json(
      { error: '목표 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 공개 목표에 반응 추가 (조회수, 응원 등)
export async function POST(request: NextRequest) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const body = await request.json();
    
    const {
      goalId,
      action, // 'view', 'support', 'comment'
      userId,
      data
    } = body;

    if (!goalId || !action) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const goalRef = firestore.collection('publicGoals').doc(goalId);
    const goalDoc = await goalRef.get();
    
    if (!goalDoc.exists) {
      return NextResponse.json(
        { error: '목표를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const goalData = goalDoc.data();
    const updates: any = {};

    switch (action) {
      case 'view':
        updates.viewCount = (goalData.viewCount || 0) + 1;
        break;
      case 'support':
        updates.supportCount = (goalData.supportCount || 0) + 1;
        // 실제 응원 데이터는 별도 컬렉션에 저장
        if (userId && data?.message) {
          await firestore.collection('publicGoalSupports').add({
            goalId,
            supporterId: userId,
            message: data.message,
            type: data.type || 'CHEER',
            createdAt: new Date()
          });
        }
        break;
      case 'comment':
        updates.commentCount = (goalData.commentCount || 0) + 1;
        // 실제 댓글 데이터는 별도 컬렉션에 저장
        if (userId && data?.comment) {
          await firestore.collection('publicGoalComments').add({
            goalId,
            commenterId: userId,
            comment: data.comment,
            createdAt: new Date()
          });
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await goalRef.update(updates);
    }

    return NextResponse.json({
      success: true,
      message: `${action} 처리 완료`,
      newCounts: {
        viewCount: goalData.viewCount + (updates.viewCount ? 1 : 0),
        supportCount: goalData.supportCount + (updates.supportCount ? 1 : 0),
        commentCount: goalData.commentCount + (updates.commentCount ? 1 : 0)
      }
    });

  } catch (error) {
    console.error('공개 목표 반응 처리 오류:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}