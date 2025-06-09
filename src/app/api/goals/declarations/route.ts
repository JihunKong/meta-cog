import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

// 목표 선언 생성
export async function POST(request: NextRequest) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const body = await request.json();
    
    const {
      userId,
      title,
      description,
      subject,
      targetType,
      targetAmount,
      targetUnit,
      targetDate,
      deadlineTime,
      difficulty = 'MEDIUM',
      isPublic = true,
      motivation,
      reward
    } = body;

    // 필수 필드 검증
    if (!userId || !title || !subject || !targetType || !targetAmount || !targetDate) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 목표 선언 데이터 생성
    const goalDeclaration = {
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      subject,
      targetType,
      targetAmount,
      targetUnit: targetUnit || getDefaultUnit(targetType),
      targetDate: new Date(targetDate),
      deadlineTime: deadlineTime ? new Date(deadlineTime) : null,
      difficulty,
      isPublic,
      motivation: motivation?.trim() || '',
      reward: reward?.trim() || '',
      status: 'DECLARED',
      progress: 0,
      actualAmount: 0,
      declaredAt: new Date(),
      updatedAt: new Date(),
      supportCount: 0,
      commentCount: 0
    };

    // Firestore에 저장
    const docRef = await firestore.collection('goalDeclarations').add(goalDeclaration);
    
    // 사용자의 목표 선언 통계 업데이트
    await updateUserGoalStats(userId, 'declared');

    return NextResponse.json({
      success: true,
      goalId: docRef.id,
      message: '목표가 성공적으로 선언되었습니다!'
    });

  } catch (error) {
    console.error('목표 선언 생성 오류:', error);
    return NextResponse.json(
      { error: '목표 선언 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 목표 선언 목록 조회 (공개 목표 + 내 목표)
export async function GET(request: NextRequest) {
  try {
    console.log('목표 선언 GET API 시작');
    const firestore = getFirebaseAdminFirestore();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'all'; // all, my, public, friends
    const subject = searchParams.get('subject');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = firestore.collection('goalDeclarations');

    // 필터 적용
    switch (filter) {
      case 'my':
        if (!userId) {
          return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
        }
        query = query.where('userId', '==', userId);
        break;
      case 'public':
        query = query.where('isPublic', '==', true);
        break;
      case 'friends':
        // TODO: 친구 관계 구현 후 친구들의 목표만 조회
        query = query.where('isPublic', '==', true);
        break;
      default:
        // all: 공개 목표 + 내 목표
        if (userId) {
          // 복합 쿼리는 Firestore에서 제한이 있으므로 별도 처리 필요
          query = query.where('isPublic', '==', true);
        } else {
          query = query.where('isPublic', '==', true);
        }
    }

    // 추가 필터
    if (subject) {
      query = query.where('subject', '==', subject);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    // 정렬 및 페이징
    query = query.orderBy('declaredAt', 'desc')
                 .limit(limit)
                 .offset(offset);

    const snapshot = await query.get();
    const goals = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // 작성자 정보 조회
      const userDoc = await firestore.collection('users').doc(data.userId).get();
      const userData = userDoc.data();
      
      return {
        id: doc.id,
        ...data,
        author: {
          id: data.userId,
          name: userData?.name || '익명',
          school: userData?.school || ''
        },
        declaredAt: data.declaredAt?.toDate?.() || data.declaredAt,
        targetDate: data.targetDate?.toDate?.() || data.targetDate,
        deadlineTime: data.deadlineTime?.toDate?.() || data.deadlineTime,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      };
    }));

    return NextResponse.json({
      success: true,
      goals,
      hasMore: snapshot.docs.length === limit
    });

  } catch (error) {
    console.error('목표 선언 조회 오류:', error);
    return NextResponse.json(
      { error: '목표 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 목표 타입별 기본 단위 반환
function getDefaultUnit(targetType: string): string {
  const units: Record<string, string> = {
    TIME: '분',
    PROBLEMS: '문제',
    PAGES: '페이지',
    SESSIONS: '회',
    CUSTOM: '개'
  };
  return units[targetType] || '개';
}

// 사용자 목표 통계 업데이트
async function updateUserGoalStats(userId: string, action: 'declared' | 'completed' | 'failed') {
  try {
    const firestore = getFirebaseAdminFirestore();
    const userStatsRef = firestore.collection('userGoalStats').doc(userId);
    
    const statsDoc = await userStatsRef.get();
    const currentStats = statsDoc.exists ? statsDoc.data() : {
      totalDeclared: 0,
      totalCompleted: 0,
      totalFailed: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastGoalDate: null
    };

    const updates: any = {
      updatedAt: new Date()
    };

    switch (action) {
      case 'declared':
        updates.totalDeclared = (currentStats.totalDeclared || 0) + 1;
        updates.lastGoalDate = new Date();
        break;
      case 'completed':
        updates.totalCompleted = (currentStats.totalCompleted || 0) + 1;
        // 연속 달성 계산
        const newStreak = (currentStats.currentStreak || 0) + 1;
        updates.currentStreak = newStreak;
        updates.longestStreak = Math.max(newStreak, currentStats.longestStreak || 0);
        break;
      case 'failed':
        updates.totalFailed = (currentStats.totalFailed || 0) + 1;
        updates.currentStreak = 0; // 연속 기록 초기화
        break;
    }

    await userStatsRef.set({ ...currentStats, ...updates }, { merge: true });
  } catch (error) {
    console.error('사용자 목표 통계 업데이트 오류:', error);
  }
}