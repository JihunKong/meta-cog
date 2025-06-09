const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Firebase 초기화
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createTestData() {
  console.log('📝 스크린샷용 테스트 데이터 생성 시작...\n');

  try {
    // 1. 테스트 계정 생성
    console.log('1. 테스트 계정 생성 중...');
    
    // 학생 계정들
    const students = [
      { email: 'student1@test.com', password: 'test1234', name: '김철수', school: '전남과학고등학교' },
      { email: 'student2@test.com', password: 'test1234', name: '이영희', school: '전남과학고등학교' },
      { email: 'student3@test.com', password: 'test1234', name: '박민수', school: '전남과학고등학교' },
      { email: 'student4@test.com', password: 'test1234', name: '정지은', school: '전남과학고등학교' },
      { email: 'student5@test.com', password: 'test1234', name: '최동현', school: '전남과학고등학교' }
    ];

    const studentIds = [];
    
    for (const student of students) {
      try {
        // 기존 계정 삭제 시도
        try {
          const existingUser = await auth.getUserByEmail(student.email);
          await auth.deleteUser(existingUser.uid);
          await db.collection('users').doc(existingUser.uid).delete();
        } catch (e) {
          // 계정이 없으면 무시
        }

        // 새 계정 생성
        const userRecord = await auth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.name
        });

        // Firestore에 사용자 정보 저장
        await db.collection('users').doc(userRecord.uid).set({
          email: student.email,
          name: student.name,
          school: student.school,
          role: 'student',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        studentIds.push(userRecord.uid);
        console.log(`✅ 학생 계정 생성: ${student.name} (${student.email})`);
      } catch (error) {
        console.error(`❌ 학생 계정 생성 실패: ${student.email}`, error.message);
      }
    }

    // 교사 계정
    try {
      const teacherEmail = 'teacher@test.com';
      try {
        const existingUser = await auth.getUserByEmail(teacherEmail);
        await auth.deleteUser(existingUser.uid);
        await db.collection('users').doc(existingUser.uid).delete();
      } catch (e) {}

      const teacherRecord = await auth.createUser({
        email: teacherEmail,
        password: 'test1234',
        displayName: '김선생'
      });

      await db.collection('users').doc(teacherRecord.uid).set({
        email: teacherEmail,
        name: '김선생',
        school: '전남과학고등학교',
        role: 'teacher',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ 교사 계정 생성: 김선생 (teacher@test.com)');
    } catch (error) {
      console.error('❌ 교사 계정 생성 실패:', error.message);
    }

    console.log('\n2. 학습 세션 데이터 생성 중...');
    
    const subjects = ['국어', '영어', '수학', '과학', '사회'];
    const today = new Date();
    
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const student = students[i];
      
      // 최근 7일간의 세션 데이터 생성
      for (let day = 0; day < 7; day++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() - day);
        
        // 하루에 2-4개의 세션
        const sessionCount = Math.floor(Math.random() * 3) + 2;
        
        for (let s = 0; s < sessionCount; s++) {
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const duration = Math.floor(Math.random() * 60) + 30; // 30-90분
          
          const startTime = new Date(sessionDate);
          startTime.setHours(14 + Math.floor(Math.random() * 8)); // 14시-22시
          
          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + duration);
          
          await db.collection('sessions').add({
            userId: studentId,
            userName: student.name,
            subject,
            goal: `${subject} ${Math.floor(Math.random() * 5) + 1}단원 복습`,
            startTime: admin.firestore.Timestamp.fromDate(startTime),
            endTime: admin.firestore.Timestamp.fromDate(endTime),
            duration,
            reflection: '열심히 공부했습니다!',
            difficulty: Math.floor(Math.random() * 3) + 3, // 3-5
            createdAt: admin.firestore.Timestamp.fromDate(startTime)
          });
        }
      }
      
      console.log(`✅ ${student.name} 학생의 세션 데이터 생성 완료`);
    }

    console.log('\n3. 목표 선언 데이터 생성 중...');
    
    const goals = [
      '오늘은 수학 문제집 30문제를 풀어보겠습니다!',
      '영어 단어 50개 암기 도전! 💪',
      '국어 비문학 지문 5개 분석하기',
      '과학 실험 보고서 작성 완료하기',
      '역사 3단원 정리노트 만들기',
      '수학 미적분 개념 완벽 정리!',
      '영어 에세이 초안 작성하기',
      '물리 문제 20문제 도전',
      '화학 반응식 정리하고 암기하기',
      '생물 세포 단원 복습 완료!'
    ];

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const student = students[i];
      
      // 각 학생당 2-3개의 목표
      const goalCount = Math.floor(Math.random() * 2) + 2;
      
      for (let g = 0; g < goalCount; g++) {
        const goalText = goals[Math.floor(Math.random() * goals.length)];
        const createdAt = new Date();
        createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 5));
        
        const goalRef = await db.collection('dailyGoals').add({
          userId: studentId,
          content: goalText,
          author: {
            id: studentId,
            name: student.name,
            school: student.school
          },
          supportCount: Math.floor(Math.random() * 10),
          commentCount: Math.floor(Math.random() * 5),
          createdAt: admin.firestore.Timestamp.fromDate(createdAt),
          updatedAt: admin.firestore.Timestamp.fromDate(createdAt)
        });

        // 응원 데이터 추가
        const supporterCount = Math.floor(Math.random() * 3);
        for (let s = 0; s < supporterCount; s++) {
          const supporterId = studentIds[Math.floor(Math.random() * studentIds.length)];
          if (supporterId !== studentId) {
            await db.collection('dailyGoalSupports').add({
              goalId: goalRef.id,
              supporterId,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }

        // 댓글 데이터 추가
        const commentCount = Math.floor(Math.random() * 3);
        const comments = [
          '화이팅! 할 수 있어요!',
          '저도 같이 공부해요!',
          '오늘 목표 멋져요!',
          '응원합니다! 👍',
          '같이 열심히 해봐요!'
        ];

        for (let c = 0; c < commentCount; c++) {
          const commenterId = studentIds[Math.floor(Math.random() * studentIds.length)];
          const commenterName = students.find(s => studentIds[students.indexOf(s)] === commenterId)?.name || '익명';
          
          await db.collection('dailyGoalComments').add({
            goalId: goalRef.id,
            userId: commenterId,
            content: comments[Math.floor(Math.random() * comments.length)],
            author: {
              name: commenterName,
              school: '전남과학고등학교'
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      console.log(`✅ ${student.name} 학생의 목표 데이터 생성 완료`);
    }

    console.log('\n4. 리더보드 데이터 생성 중...');
    
    // 오늘 날짜로 리더보드 데이터 생성
    const leaderboardData = studentIds.map((studentId, index) => ({
      userId: studentId,
      userName: students[index].name,
      userSchool: students[index].school,
      totalMinutes: Math.floor(Math.random() * 300) + 100,
      sessionCount: Math.floor(Math.random() * 10) + 5,
      rank: index + 1,
      date: today.toISOString().split('T')[0]
    }));

    // 랭킹 정렬
    leaderboardData.sort((a, b) => b.totalMinutes - a.totalMinutes);
    leaderboardData.forEach((data, index) => {
      data.rank = index + 1;
    });

    for (const data of leaderboardData) {
      await db.collection('leaderboard').add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log('✅ 리더보드 데이터 생성 완료');

    console.log('\n🎉 모든 테스트 데이터 생성 완료!');
    console.log('\n📌 테스트 계정 정보:');
    console.log('학생: student1@test.com ~ student5@test.com (비밀번호: test1234)');
    console.log('교사: teacher@test.com (비밀번호: test1234)');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

createTestData();