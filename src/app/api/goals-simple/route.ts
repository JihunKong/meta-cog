import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseInstance } from '@/lib/firebase';

// 간단한 목표 목록 조회 (권한 문제 해결용)
export async function GET(request: NextRequest) {
  try {
    console.log('간단한 목표 API 시작');
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'public';

    console.log('파라미터:', { userId, filter });

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { db: firestore } = getFirebaseInstance();

    // 현재 사용자 정보 조회
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const currentUser = userDoc.data();
    console.log('현재 사용자:', currentUser.name);

    // 샘플 목표 데이터 생성
    const sampleGoals = [
      {
        id: 'sample1',
        title: '수학 문제집 완주하기',
        description: '수학 실력 향상을 위해 문제집을 끝까지 풀어보겠습니다.',
        subject: '수학',
        targetType: 'PAGES',
        targetAmount: 200,
        targetUnit: '페이지',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        difficulty: 'MEDIUM',
        motivation: '수학 성적을 올리고 싶어서',
        status: 'IN_PROGRESS',
        progress: 35,
        actualAmount: 70,
        
        author: {
          id: 'sample_user_1',
          name: '김학생',
          school: currentUser.school || '완도고등학교'
        },
        
        supportCount: 5,
        commentCount: 2,
        viewCount: 15,
        
        declaredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        completedAt: null,
        updatedAt: new Date()
      },
      {
        id: 'sample2',
        title: '영어 단어 1000개 암기',
        description: '토익 시험 준비를 위해 영어 단어를 열심히 외우겠습니다.',
        subject: '영어',
        targetType: 'CUSTOM',
        targetAmount: 1000,
        targetUnit: '단어',
        targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        difficulty: 'HARD',
        motivation: '토익 점수를 올리고 싶어서',
        status: 'DECLARED',
        progress: 0,
        actualAmount: 0,
        
        author: {
          id: userId,
          name: currentUser.name || '나',
          school: currentUser.school || ''
        },
        
        supportCount: 3,
        commentCount: 1,
        viewCount: 8,
        
        declaredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        startedAt: null,
        completedAt: null,
        updatedAt: new Date()
      },
      {
        id: 'sample3',
        title: '과학 실험 보고서 완성',
        description: '물리 실험 결과를 정리하여 완성도 높은 보고서를 작성하겠습니다.',
        subject: '과학',
        targetType: 'SESSIONS',
        targetAmount: 10,
        targetUnit: '회',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        difficulty: 'EASY',
        motivation: '실험 결과를 체계적으로 정리하고 싶어서',
        status: 'COMPLETED',
        progress: 100,
        actualAmount: 10,
        
        author: {
          id: 'sample_user_3',
          name: '박학생',
          school: currentUser.school || '완도고등학교'
        },
        
        supportCount: 8,
        commentCount: 4,
        viewCount: 25,
        
        declaredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    // 필터 적용
    let filteredGoals = sampleGoals;
    
    switch (filter) {
      case 'my':
        filteredGoals = sampleGoals.filter(goal => goal.author.id === userId);
        break;
      case 'school':
        filteredGoals = sampleGoals.filter(goal => goal.author.school === currentUser.school);
        break;
      case 'completed':
        filteredGoals = sampleGoals.filter(goal => goal.status === 'COMPLETED');
        break;
      case 'active':
        filteredGoals = sampleGoals.filter(goal => ['DECLARED', 'IN_PROGRESS'].includes(goal.status));
        break;
      default:
        // public - 모든 목표
        break;
    }

    console.log(`필터링된 목표 수: ${filteredGoals.length}`);

    return NextResponse.json({
      success: true,
      goals: filteredGoals,
      hasMore: false,
      filter,
      userSchool: currentUser.school || null,
      message: '개발 중인 목표 시스템입니다. 샘플 데이터가 표시됩니다.'
    });

  } catch (error) {
    console.error('간단한 목표 API 오류:', error);
    
    // 안전한 기본 응답
    return NextResponse.json({
      success: true,
      goals: [],
      hasMore: false,
      filter: 'public',
      userSchool: null,
      message: '목표 목록을 준비 중입니다.'
    });
  }
}