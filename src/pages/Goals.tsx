import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// 과목 데이터
const SUBJECTS = [
  { id: 'math', name: '수학', areas: ['대수', '기하', '미적분', '통계', '확률'] },
  { id: 'science', name: '과학', areas: ['물리', '화학', '생물', '지구과학'] },
  { id: 'english', name: '영어', areas: ['독해', '문법', '어휘', '쓰기', '말하기'] },
  { id: 'korean', name: '국어', areas: ['문학', '비문학', '문법', '작문'] },
  { id: 'social', name: '사회', areas: ['역사', '지리', '일반사회', '윤리'] },
];

// 난이도 레벨
const DIFFICULTY_LEVELS = [
  { value: 'easy', label: '쉬움', description: '기본 개념 이해 및 간단한 문제 풀이' },
  { value: 'medium', label: '보통', description: '응용 문제 및 개념 연결하기' },
  { value: 'hard', label: '어려움', description: '심화 개념 및 복합 문제 해결' },
];

function Goals() {
  // URL 파라미터에서 과목 가져오기
  const [searchParams] = useSearchParams();
  const subjectParam = searchParams.get('subject');
  
  // 상태 관리
  const [selectedSubject, setSelectedSubject] = useState(
    SUBJECTS.find(s => s.name === subjectParam)?.id || ''
  );
  const [selectedArea, setSelectedArea] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [measureMethod, setMeasureMethod] = useState('quiz');
  const [targetScore, setTargetScore] = useState(80);
  
  // 내 목표 목록
  const [myGoals, setMyGoals] = useState([
    {
      id: 1,
      title: '이차방정식의 근과 판별식 이해하기',
      subject: '수학',
      area: '대수',
      difficulty: 'medium',
      targetDate: '2024-04-20',
      progress: 60,
      isExpanded: false
    },
    {
      id: 2,
      title: '영어 관사 완벽 정복',
      subject: '영어',
      area: '문법',
      difficulty: 'hard',
      targetDate: '2024-04-25',
      progress: 30,
      isExpanded: false
    },
    {
      id: 3,
      title: '산-염기 반응 이해하기',
      subject: '과학',
      area: '화학',
      difficulty: 'medium',
      targetDate: '2024-04-18',
      progress: 45,
      isExpanded: false
    }
  ]);
  
  // 과목 선택 시 영역 초기화
  useEffect(() => {
    setSelectedArea('');
  }, [selectedSubject]);
  
  // 목표 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newGoal = {
      id: myGoals.length + 1,
      title: goalTitle,
      subject: SUBJECTS.find(s => s.id === selectedSubject)?.name || '',
      area: selectedArea,
      difficulty: difficulty,
      targetDate: targetDate,
      progress: 0,
      isExpanded: false
    };
    
    setMyGoals([newGoal, ...myGoals]);
    
    // 폼 초기화
    setGoalTitle('');
    setGoalDescription('');
    setDifficulty('medium');
    setTargetDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setMeasureMethod('quiz');
    setTargetScore(80);
  };
  
  // 목표 토글 확장
  const toggleGoalExpand = (id: number) => {
    setMyGoals(myGoals.map(goal => 
      goal.id === id ? { ...goal, isExpanded: !goal.isExpanded } : goal
    ));
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">SMART 목표 설정</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 목표 설정 폼 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">새 학습 목표 만들기</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 과목 및 영역 선택 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      과목
                    </label>
                    <select
                      id="subject"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">과목 선택</option>
                      {SUBJECTS.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                      영역
                    </label>
                    <select
                      id="area"
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={!selectedSubject}
                      required
                    >
                      <option value="">영역 선택</option>
                      {selectedSubject && SUBJECTS.find(s => s.id === selectedSubject)?.areas.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* 목표 제목 및 설명 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    목표 제목 (Specific)
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="구체적인 목표를 한 문장으로 작성하세요"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    상세 설명
                  </label>
                  <textarea
                    id="description"
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="목표 달성을 위한 세부 계획이나 학습 내용을 작성하세요"
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* 난이도 및 기한 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      난이도 (Achievable)
                    </label>
                    <div className="flex space-x-4">
                      {DIFFICULTY_LEVELS.map((level) => (
                        <label key={level.value} className="flex items-center">
                          <input
                            type="radio"
                            value={level.value}
                            checked={difficulty === level.value}
                            onChange={() => setDifficulty(level.value)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {DIFFICULTY_LEVELS.find(l => l.value === difficulty)?.description}
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
                      목표 달성일 (Time-bound)
                    </label>
                    <input
                      type="date"
                      id="targetDate"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                {/* 측정 방법 */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">측정 방법 (Measurable)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="measureMethod" className="block text-sm font-medium text-gray-700 mb-1">
                        평가 방식
                      </label>
                      <select
                        id="measureMethod"
                        value={measureMethod}
                        onChange={(e) => setMeasureMethod(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="quiz">퀴즈/문제 풀이</option>
                        <option value="assignment">과제 완성</option>
                        <option value="project">프로젝트</option>
                        <option value="self">자가 평가</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="targetScore" className="block text-sm font-medium text-gray-700 mb-1">
                        목표 달성 점수 (%)
                      </label>
                      <input
                        type="number"
                        id="targetScore"
                        value={targetScore}
                        onChange={(e) => setTargetScore(Number(e.target.value))}
                        min="0"
                        max="100"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              targetScore >= 80 ? 'bg-green-600' : 
                              targetScore >= 60 ? 'bg-blue-600' : 'bg-yellow-500'
                            }`} 
                            style={{ width: `${targetScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 관련성 확인 */}
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-md font-medium text-blue-800 mb-2">관련성 체크 (Relevant)</h3>
                  <p className="text-sm text-blue-700 mb-3">이 목표가 아래 항목과 관련이 있는지 확인하세요:</p>
                  
                  <div className="space-y-2">
                    <label className="inline-flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-blue-700">현재 학습 계획과 연계됨</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-blue-700">교과 과정과 일치함</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-blue-700">학습 우선순위에 부합함</span>
                    </label>
                  </div>
                </div>
                
                {/* 제출 버튼 */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    목표 설정하기
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* 내 목표 목록 */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">내 목표 목록</h2>
              
              {myGoals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">설정된 목표가 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {myGoals.map((goal) => (
                    <li 
                      key={goal.id} 
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleGoalExpand(goal.id)}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-medium text-gray-900">{goal.title}</h3>
                          <span 
                            className={`text-xs px-2 py-1 rounded-full ${
                              goal.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              goal.difficulty === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {goal.difficulty === 'easy' ? '쉬움' : 
                             goal.difficulty === 'medium' ? '보통' : '어려움'}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex justify-between text-sm text-gray-500">
                          <span>{goal.subject} - {goal.area}</span>
                          <span>마감일: {goal.targetDate}</span>
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>진행률</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                goal.progress >= 80 ? 'bg-green-600' : 
                                goal.progress >= 50 ? 'bg-blue-600' : 'bg-yellow-500'
                              }`} 
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {goal.isExpanded && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <div className="flex space-x-2">
                            <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                              진행률 업데이트
                            </button>
                            <button className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                              수정
                            </button>
                            <button className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200">
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Goals; 