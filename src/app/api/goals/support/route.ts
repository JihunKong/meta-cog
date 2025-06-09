import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseInstance } from '@/lib/firebase';

// 목표 응원하기
export async function POST(request: NextRequest) {
  try {
    const { firestore } = getFirebaseInstance();
    const body = await request.json();
    
    const {
      goalId,
      supporterId,
      supportType = 'CHEER', // CHEER, JOIN, HELP, MENTOR
      message,
      isAnonymous = false
    } = body;

    // 필수 필드 검증
    if (!goalId || !supporterId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 목표 존재 확인
    const goalDoc = await firestore.collection('goalDeclarations').doc(goalId).get();
    if (!goalDoc.exists) {
      return NextResponse.json(
        { error: '목표를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const goalData = goalDoc.data();
    
    // 자신의 목표는 응원할 수 없음
    if (goalData.userId === supporterId) {
      return NextResponse.json(
        { error: '자신의 목표는 응원할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 응원했는지 확인
    const existingSupport = await firestore
      .collection('goalSupports')
      .where('goalId', '==', goalId)
      .where('supporterId', '==', supporterId)
      .get();

    if (!existingSupport.empty) {
      return NextResponse.json(
        { error: '이미 응원한 목표입니다.' },
        { status: 400 }
      );
    }

    // 응원 데이터 생성
    const supportData = {
      goalId,
      supporterId,
      supportType,
      message: message?.trim() || '',
      isAnonymous,
      createdAt: new Date()
    };

    // 응원 저장
    const supportRef = await firestore.collection('goalSupports').add(supportData);

    // 목표의 응원 수 업데이트
    await firestore.collection('goalDeclarations').doc(goalId).update({
      supportCount: (goalData.supportCount || 0) + 1,
      updatedAt: new Date()
    });

    // 목표 작성자에게 알림 생성 (비동기)
    createSupportNotification(goalData.userId, supporterId, goalId, goalData.title, message, isAnonymous);

    // 응원자 통계 업데이트 (비동기)
    updateSupporterStats(supporterId, supportType);

    return NextResponse.json({
      success: true,
      supportId: supportRef.id,
      message: getSupportMessage(supportType)
    });

  } catch (error) {
    console.error('목표 응원 오류:', error);
    return NextResponse.json(
      { error: '응원 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 목표의 응원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { firestore } = getFirebaseInstance();
    const { searchParams } = new URL(request.url);
    
    const goalId = searchParams.get('goalId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!goalId) {
      return NextResponse.json(
        { error: '목표 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const snapshot = await firestore
      .collection('goalSupports')
      .where('goalId', '==', goalId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const supports = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      if (data.isAnonymous) {
        return {
          id: doc.id,
          type: data.supportType,
          message: data.message,
          isAnonymous: true,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        };
      }

      // 응원자 정보 조회
      const supporterDoc = await firestore.collection('users').doc(data.supporterId).get();
      const supporterData = supporterDoc.data();

      return {
        id: doc.id,
        type: data.supportType,
        message: data.message,
        supporter: {
          id: data.supporterId,
          name: supporterData?.name || '익명',
          school: supporterData?.school || ''
        },
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      };
    }));

    return NextResponse.json({
      success: true,
      supports
    });

  } catch (error) {
    console.error('응원 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '응원 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 응원 타입별 메시지
function getSupportMessage(supportType: string): string {
  const messages: Record<string, string> = {
    CHEER: '응원 메시지를 보냈습니다! 🎉',
    JOIN: '함께 도전하겠다고 표현했습니다! 🤝',
    HELP: '도움을 주겠다고 제안했습니다! 🤗',
    MENTOR: '멘토링을 제안했습니다! 🧑‍🏫'
  };
  return messages[supportType] || '응원 완료!';
}

// 응원 알림 생성
async function createSupportNotification(
  goalOwnerId: string, 
  supporterId: string, 
  goalId: string, 
  goalTitle: string,
  message: string,
  isAnonymous: boolean
) {
  try {
    const { firestore } = getFirebaseInstance();
    
    // 응원자 정보 조회
    let supporterName = '익명의 사용자';
    if (!isAnonymous) {
      const supporterDoc = await firestore.collection('users').doc(supporterId).get();
      const supporterData = supporterDoc.data();
      supporterName = supporterData?.name || '익명의 사용자';
    }

    const notificationData = {
      userId: goalOwnerId,
      type: 'GOAL_SUPPORT',
      title: '목표 응원을 받았습니다!',
      message: `${supporterName}님이 "${goalTitle}" 목표를 응원했습니다.`,
      supportMessage: message,
      goalId,
      supporterId: isAnonymous ? null : supporterId,
      isRead: false,
      createdAt: new Date()
    };

    await firestore.collection('notifications').add(notificationData);
  } catch (error) {
    console.error('응원 알림 생성 오류:', error);
  }
}

// 응원자 통계 업데이트
async function updateSupporterStats(supporterId: string, supportType: string) {
  try {
    const { firestore } = getFirebaseInstance();
    const statsRef = firestore.collection('userSupportStats').doc(supporterId);
    
    const statsDoc = await statsRef.get();
    const currentStats = statsDoc.exists ? statsDoc.data() : {
      totalSupports: 0,
      cheerCount: 0,
      joinCount: 0,
      helpCount: 0,
      mentorCount: 0
    };

    const updates: any = {
      totalSupports: (currentStats.totalSupports || 0) + 1,
      updatedAt: new Date()
    };

    const typeKey = `${supportType.toLowerCase()}Count`;
    if (currentStats.hasOwnProperty(typeKey)) {
      updates[typeKey] = (currentStats[typeKey] || 0) + 1;
    }

    await statsRef.set({ ...currentStats, ...updates }, { merge: true });
  } catch (error) {
    console.error('응원자 통계 업데이트 오류:', error);
  }
}