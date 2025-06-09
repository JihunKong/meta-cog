import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const body = await request.json();
    
    const { userId, content } = body;

    if (!userId || !content?.trim()) {
      return NextResponse.json(
        { error: '사용자 ID와 목표 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    const dailyGoal = {
      userId,
      content: content.trim(),
      author: {
        id: userId,
        name: userData?.name || '익명',
        school: userData?.school || ''
      },
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await firestore.collection('dailyGoals').add(dailyGoal);

    return NextResponse.json({
      success: true,
      goalId: docRef.id,
      message: '목표가 성공적으로 등록되었습니다!'
    });

  } catch (error) {
    console.error('일일 목표 생성 오류:', error);
    return NextResponse.json(
      { error: '목표 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const userSchool = userData?.school;

    let goalsQuery = firestore.collection('dailyGoals');

    if (userSchool) {
      const usersInSchoolSnapshot = await firestore
        .collection('users')
        .where('school', '==', userSchool)
        .get();
      
      const userIdsInSchool = usersInSchoolSnapshot.docs.map(doc => doc.id);
      
      if (userIdsInSchool.length > 0) {
        const chunks = [];
        for (let i = 0; i < userIdsInSchool.length; i += 10) {
          chunks.push(userIdsInSchool.slice(i, i + 10));
        }

        let allGoals: any[] = [];
        for (const chunk of chunks) {
          const chunkSnapshot = await firestore
            .collection('dailyGoals')
            .where('userId', 'in', chunk)
            .get();
          allGoals.push(...chunkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        allGoals.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        const goals = allGoals.slice(0, limit);

        const finalGoals = await Promise.all(goals.map(async (goalData) => {
          const supportSnapshot = await firestore
            .collection('dailyGoalSupports')
            .where('goalId', '==', goalData.id)
            .where('userId', '==', userId)
            .get();

          return {
            id: goalData.id,
            userId: goalData.userId,
            content: goalData.content,
            author: goalData.author,
            supportCount: goalData.supportCount || 0,
            commentCount: goalData.commentCount || 0,
            createdAt: goalData.createdAt?.toDate?.() || goalData.createdAt,
            isSupported: !supportSnapshot.empty
          };
        }));

        return NextResponse.json({
          success: true,
          goals: finalGoals
        });
      }
    }

    const snapshot = await firestore
      .collection('dailyGoals')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const finalGoals = await Promise.all(snapshot.docs.map(async (doc) => {
      const goalData = doc.data();
      
      const supportSnapshot = await firestore
        .collection('dailyGoalSupports')
        .where('goalId', '==', doc.id)
        .where('userId', '==', userId)
        .get();

      return {
        id: doc.id,
        userId: goalData.userId,
        content: goalData.content,
        author: goalData.author,
        supportCount: goalData.supportCount || 0,
        commentCount: goalData.commentCount || 0,
        createdAt: goalData.createdAt?.toDate?.() || goalData.createdAt,
        isSupported: !supportSnapshot.empty
      };
    }));

    return NextResponse.json({
      success: true,
      goals: finalGoals
    });

  } catch (error) {
    console.error('일일 목표 조회 오류:', error);
    return NextResponse.json(
      { error: '목표 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}