import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName') || '학생';
  
  // 가상의 학습 데이터 (실제로는 API나 데이터베이스에서 가져옴)
  const [learningData, setLearningData] = useState({
    weeklyGoals: { total: 5, completed: 3 },
    studyTime: { thisWeek: 12, lastWeek: 10 },
    subjects: [
      { name: '수학', progress: 75, efficacy: 85 },
      { name: '과학', progress: 60, efficacy: 72 },
      { name: '영어', progress: 90, efficacy: 88 },
    ],
    recentActivities: [
      { type: '목표달성', subject: '영어', date: '2024-04-11', status: 'completed' },
      { type: '학습세션', subject: '수학', date: '2024-04-10', status: 'completed' },
      { type: '성찰일지', subject: '전체', date: '2024-04-09', status: 'completed' },
    ]
  });
  
  // AI 추천 메시지 (실제로는 API에서 가져옴)
  const [aiRecommendations, setAiRecommendations] = useState([
    '수학 학습 시 핵심 개념을 먼저 이해하고 문제 풀이로 넘어가세요.',
    '오늘 설정한 과학 학습 목표는 양이 많습니다. 우선순위를 정해보세요.',
    '영어 학습에서 보이는 패턴을 다른 과목에도 적용해보세요.'
  ]);

  return (
    <main className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">안녕하세요, {userName}님!</h1>
          <p className="mt-2 text-gray-600">오늘의 학습 현황과 목표를 확인하세요.</p>
        </div>
        
        {/* 대시보드 그리드 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* 목표 달성 카드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">주간 목표 달성</h2>
              <Link to="/goals" className="text-sm text-blue-600 hover:text-blue-800">관리하기</Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {Math.round((learningData.weeklyGoals.completed / learningData.weeklyGoals.total) * 100)}%
                </span>
              </div>
              <div>
                <p className="text-gray-600">총 {learningData.weeklyGoals.total}개 목표 중</p>
                <p className="text-lg font-semibold">{learningData.weeklyGoals.completed}개 완료</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(learningData.weeklyGoals.completed / learningData.weeklyGoals.total) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* 학습 시간 카드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">주간 학습 시간</h2>
              <Link to="/monitoring" className="text-sm text-blue-600 hover:text-blue-800">세부 보기</Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">{learningData.studyTime.thisWeek}h</span>
              </div>
              <div>
                <p className="text-gray-600">지난주 대비</p>
                <p className="text-lg font-semibold">
                  {learningData.studyTime.thisWeek > learningData.studyTime.lastWeek 
                    ? `+${learningData.studyTime.thisWeek - learningData.studyTime.lastWeek}시간`
                    : `${learningData.studyTime.thisWeek - learningData.studyTime.lastWeek}시간`
                  }
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <div key={day} className="text-center">
                  <div 
                    className={`h-6 w-full rounded ${day <= 4 ? 'bg-green-500' : 'bg-gray-200'}`}
                    style={{ height: `${(day <= 4 ? 20 + day * 10 : 0)}px` }}
                  ></div>
                  <div className="text-xs mt-1">{['월', '화', '수', '목', '금', '토', '일'][day]}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* AI 추천 카드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">AI 학습 조언</h2>
              <Link to="/feedback" className="text-sm text-blue-600 hover:text-blue-800">모든 조언 보기</Link>
            </div>
            <ul className="space-y-3">
              {aiRecommendations.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
            <button className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              새로운 조언 받기
            </button>
          </div>
          
          {/* 교과별 진행 상황 */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">교과별 학습 진행 상황</h2>
              <Link to="/monitoring" className="text-sm text-blue-600 hover:text-blue-800">세부 보기</Link>
            </div>
            <div className="space-y-4">
              {learningData.subjects.map((subject) => (
                <div key={subject.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                    <span className="text-sm font-medium text-gray-700">{subject.progress}% 완료</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        subject.progress >= 80 ? 'bg-green-600' : 
                        subject.progress >= 50 ? 'bg-blue-600' : 'bg-yellow-500'
                      }`} 
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>학습 효율: {subject.efficacy}%</span>
                    <Link to={`/goals?subject=${subject.name}`} className="text-blue-500 hover:underline">
                      목표 관리
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 최근 활동 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">최근 학습 활동</h2>
              <Link to="/monitoring" className="text-sm text-blue-600 hover:text-blue-800">모든 활동 보기</Link>
            </div>
            <ul className="divide-y divide-gray-200">
              {learningData.recentActivities.map((activity, index) => (
                <li key={index} className="py-3 flex items-start">
                  <div 
                    className={`rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mr-3 ${
                      activity.status === 'completed' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {activity.type === '목표달성' 
                      ? '✓' 
                      : activity.type === '학습세션' 
                        ? '📚' 
                        : '📝'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">{activity.type}</div>
                    <div className="text-sm text-gray-500 flex items-center justify-between">
                      <span>{activity.subject} | {activity.date}</span>
                      <span className={activity.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                        {activity.status === 'completed' ? '완료' : '진행중'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/reflection" className="mt-4 block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              새 성찰 일지 작성
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home; 