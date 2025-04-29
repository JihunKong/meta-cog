import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

// 이 라우트는 항상 동적으로 처리됨을 명시
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('GET /api/users 요청 받음');

  try {
    // 쿼리 파라미터에서 옵션 확인
    const { searchParams } = new URL(request.url);
    const fetchRoles = searchParams.get('roles') === 'true';
    const userIds = searchParams.get('ids')?.split(',') || [];
    const role = searchParams.get('role');

    // Firebase Admin 인스턴스 가져오기
    const auth = getFirebaseAdminAuth();
    const db = getFirebaseAdminFirestore();
    
    // 요청 헤더에서 토큰 확인 (옵션)
    const authHeader = request.headers.get('authorization');
    let token = null;
    let user = null;
    let userRole = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Authorization 헤더에서 토큰 확인됨');
      
      try {
        // Firebase 토큰 검증
        const decodedToken = await auth.verifyIdToken(token);
        user = await auth.getUser(decodedToken.uid);
        
        // 사용자 역할 가져오기
        const profileDoc = await db.collection('Profiles').doc(user.uid).get();
        if (profileDoc.exists) {
          userRole = profileDoc.data()?.role;
        }
      } catch (tokenError) {
        console.error('토큰 검증 오류:', tokenError);
        return NextResponse.json(
          { error: '유효하지 않은 인증 토큰입니다' },
          { status: 401 }
        );
      }
    } else {
      // 토큰이 없는 경우 - 인증 실패
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('인증 오류: 사용자를 찾을 수 없음');
      return NextResponse.json(
        { error: '유효하지 않은 인증 정보입니다' },
        { status: 401 }
      );
    }
    
    // 권한 확인: 교사 또는 관리자만 다른 사용자 정보에 접근 가능
    if (userRole !== 'teacher' && userRole !== 'admin') {
      console.error('권한 오류: 사용자 역할 =', userRole);
      return NextResponse.json(
        { error: '교사나 관리자만 사용자 데이터에 접근할 수 있습니다' },
        { status: 403 }
      );
    }
    
    // 특정 ID 목록이 있는 경우
    if (userIds.length > 0) {
      console.log(`${userIds.length}개의 특정 사용자 ID에 대한 정보 요청`);
      
      try {
        // Firestore에서 profiles 컬렉션 쿼리
        const usersData = [];
        
        // 배치로 사용자 정보 가져오기
        for (const userId of userIds) {
          const profileDoc = await db.collection('Profiles').doc(userId).get();
          
          if (profileDoc.exists) {
            const profileData = profileDoc.data();
            usersData.push({
              id: userId,
              email: profileData?.email,
              role: profileData?.role,
              created_at: profileData?.created_at
            });
          } else if (userRole === 'admin') {
            // 관리자인 경우 Firebase Auth에서 직접 조회 시도
            try {
              const userRecord = await auth.getUser(userId);
              usersData.push({
                id: userRecord.uid,
                email: userRecord.email,
                role: null, // Auth에는 역할 정보가 없음
                created_at: userRecord.metadata.creationTime
              });
            } catch (userError) {
              console.error(`사용자 ID ${userId} 조회 실패:`, userError);
              // 개별 사용자 오류는 무시하고 계속 진행
            }
          }
        }
        
        return NextResponse.json(usersData);
      } catch (error) {
        console.error('사용자 데이터 조회 오류:', error);
        return NextResponse.json(
          { error: '사용자 데이터를 가져오는 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
    }
    
    // 특정 역할이 있는 경우
    if (role) {
      console.log(`역할이 '${role}'인 사용자 정보 요청`);
      
      try {
        // Firestore에서 특정 역할을 가진 사용자 조회
        const profilesSnapshot = await db.collection('Profiles')
          .where('role', '==', role)
          .get();
        
        if (!profilesSnapshot.empty) {
          const usersData = profilesSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email,
              role: data.role,
              created_at: data.created_at
            };
          });
          
          return NextResponse.json(usersData);
        } else {
          // 결과가 없는 경우 빈 배열 반환
          return NextResponse.json([]);
        }
      } catch (error) {
        console.error(`역할 '${role}' 사용자 조회 오류:`, error);
        return NextResponse.json(
          { error: '사용자 데이터를 가져오는 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
    }
    
    // 역할 목록만 요청한 경우
    if (fetchRoles) {
      console.log('사용자 역할 목록 요청');
      
      try {
        // Firestore에서 고유한 역할 목록 가져오기
        const profilesSnapshot = await db.collection('Profiles').get();
        const roles = new Set();
        
        profilesSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
          const data = doc.data();
          const role = data?.role;
          if (role) {
            roles.add(role);
          }
        });
        return NextResponse.json({ roles: Array.from(roles) });
      } catch (error) {
        console.error('역할 목록 조회 오류:', error);
        return NextResponse.json({ roles: [] });
      }
    }
    
    // 기본: 모든 사용자 목록 반환 (관리자만)
    if (userRole === 'admin') {
      console.log('관리자 권한으로 모든 사용자 목록 요청');
      
      try {
        // Firestore에서 모든 프로필 가져오기
        const profilesSnapshot = await db.collection('Profiles').get();
        
        if (!profilesSnapshot.empty) {
          const usersData = profilesSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email,
              role: data.role,
              created_at: data.created_at
            };
          });
          
          return NextResponse.json(usersData);
        } else {
          // Firebase Auth에서 모든 사용자 가져오기 시도 (최대 1000명)
          const listUsersResult = await auth.listUsers();
          const usersData = listUsersResult.users.map((userRecord: admin.auth.UserRecord) => ({
            id: userRecord.uid,
            email: userRecord.email,
            role: null, // Auth에는 역할 정보가 없음
            created_at: userRecord.metadata.creationTime
          }));
          
          return NextResponse.json(usersData);
        }
      } catch (error) {
        console.error('모든 사용자 조회 오류:', error);
        return NextResponse.json(
          { error: '사용자 데이터를 가져오는 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
    } else {
      // 교사는 모든 사용자 정보를 볼 수 없음
      return NextResponse.json(
        { error: '사용자 데이터에 접근할 권한이 없습니다' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}