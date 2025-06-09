import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

interface RouteParams {
  params: {
    id: string;
  };
}

// 목표 진행 상황 업데이트
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const { id: goalId } = params;
    const body = await request.json();

    const {
      userId,
      progressAmount,
      achievementRate, // 달성률 (%)
      message,
      mood,
      difficultyFelt,
      evidenceUrl, // 인증 이미지 URL
      evidenceDescription
    } = body;
    
    let updateType = body.updateType; // START, PROGRESS, COMPLETE, PAUSE, RESUME, ABANDON, EXTEND

    // 목표 존재 및 권한 확인
    const goalDoc = await firestore.collection('goalDeclarations').doc(goalId).get();
    if (!goalDoc.exists) {
      return NextResponse.json(
        { error: '목표를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const goalData = goalDoc.data();
    if (goalData.userId !== userId) {
      return NextResponse.json(
        { error: '업데이트 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 현재 진행률 계산
    let newActualAmount = goalData.actualAmount || 0;
    let newProgress = goalData.progress || 0;
    let newStatus = goalData.status;

    if (updateType === 'START') {
      newStatus = 'IN_PROGRESS';
    } else if (updateType === 'PROGRESS' && progressAmount) {
      newActualAmount = Math.min(goalData.targetAmount, newActualAmount + progressAmount);
      newProgress = Math.round((newActualAmount / goalData.targetAmount) * 100);
      
      // 100% 달성 시 자동 완료
      if (newProgress >= 100) {
        newStatus = 'COMPLETED';
        updateType = 'COMPLETE';
      }
    } else if (updateType === 'COMPLETE') {
      // 달성률이 제공된 경우 사용, 아니면 100%로 처리
      newProgress = achievementRate !== undefined ? achievementRate : 100;
      newActualAmount = Math.round((goalData.targetAmount * newProgress) / 100);
      newStatus = 'COMPLETED';
    } else if (updateType === 'ABANDON') {
      newStatus = 'ABANDONED';
    }

    // 업데이트 기록 생성
    const updateRecord = {
      goalId,
      updateType,
      progressAmount: progressAmount || 0,
      totalProgress: newProgress,
      message: message?.trim() || '',
      mood: mood || null,
      difficultyFelt: difficultyFelt || null,
      createdAt: new Date()
    };

    // 인증 데이터가 있으면 별도 저장
    if (evidenceUrl || evidenceDescription) {
      const evidenceRecord = {
        goalId,
        uploaderId: userId,
        evidenceType: evidenceUrl ? 'PHOTO' : 'TEXT',
        fileUrl: evidenceUrl || null,
        description: evidenceDescription || '',
        verifiedAmount: progressAmount || 0,
        timestamp: new Date(),
        isVerified: false
      };
      
      await firestore.collection('goalEvidence').add(evidenceRecord);
    }

    // 배치 업데이트
    const batch = firestore.batch();

    // 업데이트 기록 추가
    const updateRef = firestore.collection('goalUpdates').doc();
    batch.set(updateRef, updateRecord);

    // 목표 상태 업데이트
    const goalUpdates: any = {
      actualAmount: newActualAmount,
      progress: newProgress,
      status: newStatus,
      updatedAt: new Date()
    };

    if (updateType === 'START' && !goalData.startedAt) {
      goalUpdates.startedAt = new Date();
    }

    if (updateType === 'COMPLETE') {
      goalUpdates.completedAt = new Date();
    }

    batch.update(firestore.collection('goalDeclarations').doc(goalId), goalUpdates);

    await batch.commit();

    // 완료 시 통계 업데이트
    if (newStatus === 'COMPLETED') {
      await updateUserGoalStats(userId, 'completed');
      await createCompletionCelebration(userId, goalId, goalData);
    } else if (newStatus === 'ABANDONED') {
      await updateUserGoalStats(userId, 'failed');
    }

    return NextResponse.json({
      success: true,
      message: getUpdateMessage(updateType, newProgress),
      newProgress,
      newStatus,
      isCompleted: newStatus === 'COMPLETED'
    });

  } catch (error) {
    console.error('목표 업데이트 오류:', error);
    return NextResponse.json(
      { error: '목표 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 목표 업데이트 기록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const firestore = getFirebaseAdminFirestore();
    const { id: goalId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const snapshot = await firestore
      .collection('goalUpdates')
      .where('goalId', '==', goalId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const updates = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      updates
    });

  } catch (error) {
    console.error('업데이트 기록 조회 오류:', error);
    return NextResponse.json(
      { error: '업데이트 기록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 업데이트 타입별 메시지 생성
function getUpdateMessage(updateType: string, progress: number): string {
  const messages: Record<string, string> = {
    START: '목표를 시작했습니다! 화이팅! 💪',
    PROGRESS: `진행률 ${progress}%! 잘하고 있어요! 🎯`,
    COMPLETE: '목표 달성 완료! 정말 대단해요! 🎉',
    PAUSE: '잠시 휴식 중이에요. 곧 다시 시작하세요! ⏸️',
    RESUME: '다시 시작했습니다! 끝까지 화이팅! 🔥',
    ABANDON: '이번엔 아쉽지만, 다음 목표로 도전해요! 💙',
    EXTEND: '목표를 연장했습니다. 충분한 시간을 가지세요! ⏰'
  };
  return messages[updateType] || '업데이트가 완료되었습니다.';
}

// 사용자 목표 통계 업데이트
async function updateUserGoalStats(userId: string, action: 'completed' | 'failed') {
  try {
    const firestore = getFirebaseAdminFirestore();
    const userStatsRef = firestore.collection('userGoalStats').doc(userId);
    
    const statsDoc = await userStatsRef.get();
    const currentStats = statsDoc.exists ? statsDoc.data() : {
      totalCompleted: 0,
      totalFailed: 0,
      currentStreak: 0,
      longestStreak: 0
    };

    const updates: any = {
      updatedAt: new Date()
    };

    if (action === 'completed') {
      updates.totalCompleted = (currentStats.totalCompleted || 0) + 1;
      const newStreak = (currentStats.currentStreak || 0) + 1;
      updates.currentStreak = newStreak;
      updates.longestStreak = Math.max(newStreak, currentStats.longestStreak || 0);
    } else {
      updates.totalFailed = (currentStats.totalFailed || 0) + 1;
      updates.currentStreak = 0;
    }

    await userStatsRef.set({ ...currentStats, ...updates }, { merge: true });
  } catch (error) {
    console.error('사용자 통계 업데이트 오류:', error);
  }
}

// 목표 달성 축하 이벤트 생성
async function createCompletionCelebration(userId: string, goalId: string, goalData: any) {
  try {
    const firestore = getFirebaseAdminFirestore();
    
    // 축하 알림 생성
    const celebrationData = {
      userId,
      goalId,
      goalTitle: goalData.title,
      goalSubject: goalData.subject,
      completedAt: new Date(),
      celebrationType: 'GOAL_COMPLETED',
      isPublic: goalData.isPublic,
      message: `"${goalData.title}" 목표를 달성했습니다! 🎉`
    };

    await firestore.collection('celebrations').add(celebrationData);

    // 공개 목표인 경우 피드에도 추가
    if (goalData.isPublic) {
      const feedData = {
        userId,
        type: 'GOAL_ACHIEVEMENT',
        goalId,
        content: `${goalData.subject} 목표 "${goalData.title}"를 달성했습니다!`,
        createdAt: new Date()
      };
      
      await firestore.collection('publicFeed').add(feedData);
    }

  } catch (error) {
    console.error('축하 이벤트 생성 오류:', error);
  }
}