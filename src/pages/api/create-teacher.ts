import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: '필수 정보 누락' });

  try {
    const auth = getFirebaseAdminAuth();
    const db = getFirebaseAdminDb();
    // 1. Firebase Auth에 계정 생성
    const userRecord = await auth.createUser({ email, password, displayName: name });
    // 2. Firestore에 교사 프로필 생성
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role: 'teacher',
      created_at: new Date(),
      classNum: '',
      grade: '',
      school: '',
      studentNum: '',
    });
    res.status(200).json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
