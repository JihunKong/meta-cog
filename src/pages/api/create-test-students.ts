import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdminFirestore, getFirebaseAdminAuth } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // API는 POST 메소드만 허용합니다
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
  }

  try {
    const db = getFirebaseAdminFirestore();
    const auth = getFirebaseAdminAuth();
    
    // 인증된 관리자 또는 교사인지 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // 관리자 검증
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData || (userData.role !== 'admin' && userData.role !== 'teacher')) {
      return res.status(403).json({ error: '관리자 또는 교사 권한이 필요합니다' });
    }
    
    // 테스트 학생 데이터 생성
    const testStudents = [
      {
        email: 'student1@example.com',
        password: 'password123',
        displayName: '김학생',
        role: 'student'
      },
      {
        email: 'student2@example.com',
        password: 'password123',
        displayName: '이학생',
        role: 'student'
      },
      {
        email: 'student3@example.com',
        password: 'password123',
        displayName: '박학생',
        role: 'student'
      }
    ];
    
    const results = [];
    
    for (const student of testStudents) {
      try {
        // 기존 사용자가 있는지 확인
        const userExists = await auth.getUserByEmail(student.email)
          .then(() => true)
          .catch(() => false);
        
        if (userExists) {
          results.push({
            email: student.email,
            status: 'exists',
            message: '이미 존재하는 사용자입니다'
          });
          continue;
        }
        
        // Firebase Auth에 사용자 생성
        const userRecord = await auth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.displayName,
        });
        
        // Firestore에 사용자 데이터 추가
        await db.collection('users').doc(userRecord.uid).set({
          email: student.email,
          display_name: student.displayName,
          role: student.role,
          created_at: new Date(),
          last_login: null
        });
        
        results.push({
          email: student.email,
          uid: userRecord.uid,
          status: 'created',
          message: '사용자가 성공적으로 생성되었습니다'
        });
        
      } catch (error: any) {
        results.push({
          email: student.email,
          status: 'error',
          message: error.message
        });
      }
    }
    
    return res.status(200).json({ 
      message: '테스트 학생 데이터 생성 프로세스 완료',
      results 
    });
    
  } catch (error: any) {
    console.error('테스트 학생 생성 오류:', error);
    return res.status(500).json({ 
      error: '테스트 학생 생성 중 오류가 발생했습니다',
      message: error.message
    });
  }
}
