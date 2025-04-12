import { useState } from 'react';

// 성찰 질문 데이터
const REFLECTION_QUESTIONS = {
  planning: [
    { id: 'p1', text: '이 학습 과제에서 달성하고자 하는 목표는 무엇인가요?' },
    { id: 'p2', text: '이 과제를 완료하기 위해 어떤 전략이나 단계를 계획했나요?' },
    { id: 'p3', text: '이 과제를 위해 어떤 자원이나 도구가 필요할 것 같나요?' },
    { id: 'p4', text: '과제를 완료하는 데 얼마나 시간이 걸릴 것으로 예상하나요?' },
  ],
  monitoring: [
    { id: 'm1', text: '지금 사용 중인 학습 전략이 효과적인가요?' },
    { id: 'm2', text: '학습 과정에서 어떤 어려움을 겪고 있나요?' },
    { id: 'm3', text: '계획대로 진행되고 있나요? 조정이 필요한 부분이 있나요?' },
    { id: 'm4', text: '지금 이해하지 못하는 부분이 있다면 무엇인가요?' },
  ],
  evaluation: [
    { id: 'e1', text: '목표를 얼마나 잘 달성했나요?' },
    { id: 'e2', text: '가장 효과적이었던 학습 전략은 무엇이었나요?' },
    { id: 'e3', text: '다음에 이와 유사한 과제를 할 때 무엇을 다르게 하고 싶나요?' },
    { id: 'e4', text: '이번 학습 경험에서 얻은 가장 중요한 깨달음은 무엇인가요?' },
  ],
};

// 최근 성찰 일지 데이터
const RECENT_REFLECTIONS = [
  {
    id: 1,
    date: '2024-04-10',
    subject: '수학',
    title: '이차방정식 학습 성찰',
    type: 'evaluation',
    insights: ['방정식 풀이에서 실수를 줄이기 위한 체계적인 접근법 개발', '공식 암기보다 원리 이해가 중요함을 깨달음'],
  },
  {
    id: 2,
    date: '2024-04-08',
    subject: '영어',
    title: '영어 독해 전략 성찰',
    type: 'monitoring',
    insights: ['문맥에서 단어 의미를 추측하는 능력 향상', '읽기 속도와 이해도 사이의 균형 발견'],
  },
  {
    id: 3,
    date: '2024-04-05',
    subject: '과학',
    title: '화학 실험 계획 성찰',
    type: 'planning',
    insights: ['안전 수칙의 중요성 인식', '실험 전 이론적 배경 이해의 가치'],
  },
];

function Reflection() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' 또는 'history'
  const [reflectionType, setReflectionType] = useState('planning'); // 'planning', 'monitoring', 'evaluation'
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [insights, setInsights] = useState<string[]>(['']);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  // 탭 변경 처리
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // 성찰 유형 변경 처리
  const handleTypeChange = (type: string) => {
    setReflectionType(type);
    setAnswers({}); // 답변 초기화
  };
  
  // 답변 변경 처리
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // 인공지능 제안 (실제로는 API 호출)
    if (value.length > 20) {
      generateAiSuggestions();
    }
  };
  
  // 통찰 추가 처리
  const handleAddInsight = () => {
    setInsights([...insights, '']);
  };
  
  // 통찰 변경 처리
  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...insights];
    newInsights[index] = value;
    setInsights(newInsights);
  };
  
  // 통찰 삭제 처리
  const handleRemoveInsight = (index: number) => {
    if (insights.length > 1) {
      const newInsights = [...insights];
      newInsights.splice(index, 1);
      setInsights(newInsights);
    }
  };
  
  // AI 제안 생성 (실제로는 API 호출)
  const generateAiSuggestions = () => {
    const suggestions = [
      '지금 작성하신 내용은 학습의 과정 측면보다 결과에 초점이 맞춰져 있습니다. 학습 과정에서의 사고 변화도 고려해보세요.',
      '이해하기 어려웠던 개념들을 더 세분화하여 설명해보면 어떨까요?',
      '학습 전략의 효과성에 대해 더 구체적으로 평가해보는 것이 도움이 될 수 있습니다.',
    ];
    setAiSuggestions(suggestions);
  };
  
  // 성찰 일지 저장 처리
  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 여기서는 간단히 콘솔에 기록
    console.log({
      type: reflectionType,
      subject,
      title,
      answers,
      insights: insights.filter(insight => insight.trim() !== ''),
      date: new Date().toISOString(),
    });
    
    // 성공 메시지 표시 등의 처리
    alert('성찰 일지가 저장되었습니다.');
    
    // 폼 초기화
    setSubject('');
    setTitle('');
    setAnswers({});
    setInsights(['']);
    setAiSuggestions([]);
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">메타인지 성찰 도구</h1>
        
        {/* 탭 내비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('new')}
              className={`${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              새 성찰 일지 작성
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              성찰 일지 기록
            </button>
          </nav>
        </div>
        
        {activeTab === 'new' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSaveReflection} className="space-y-6">
              {/* 성찰 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">성찰 유형</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('planning')}
                    className={`py-3 px-4 border rounded-lg text-center ${
                      reflectionType === 'planning'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">계획 단계 성찰</div>
                    <div className="text-xs mt-1">학습 전 계획과 목표 설정</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleTypeChange('monitoring')}
                    className={`py-3 px-4 border rounded-lg text-center ${
                      reflectionType === 'monitoring'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">모니터링 단계 성찰</div>
                    <div className="text-xs mt-1">학습 과정 중 자기 점검</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleTypeChange('evaluation')}
                    className={`py-3 px-4 border rounded-lg text-center ${
                      reflectionType === 'evaluation'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">평가 단계 성찰</div>
                    <div className="text-xs mt-1">학습 후 결과 평가와 개선</div>
                  </button>
                </div>
              </div>
              
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    과목
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">과목 선택</option>
                    <option value="수학">수학</option>
                    <option value="과학">과학</option>
                    <option value="영어">영어</option>
                    <option value="국어">국어</option>
                    <option value="사회">사회</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    성찰 일지 제목
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="오늘의 학습 성찰 주제"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              {/* 성찰 질문 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">성찰 질문</h3>
                
                {REFLECTION_QUESTIONS[reflectionType as keyof typeof REFLECTION_QUESTIONS].map((question) => (
                  <div key={question.id} className="bg-gray-50 p-4 rounded-md">
                    <label htmlFor={question.id} className="block text-sm font-medium text-gray-700 mb-2">
                      {question.text}
                    </label>
                    <textarea
                      id={question.id}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="여기에 답변을 작성하세요..."
                    />
                  </div>
                ))}
              </div>
              
              {/* AI 제안 */}
              {aiSuggestions.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-md font-medium text-blue-800 mb-2">AI 성찰 도우미</h3>
                  <ul className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-blue-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 핵심 통찰 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">핵심 통찰</h3>
                  <button
                    type="button"
                    onClick={handleAddInsight}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 통찰 추가
                  </button>
                </div>
                
                <p className="text-sm text-gray-500">이번 성찰을 통해 얻은 핵심 깨달음이나 통찰을 간결하게 작성하세요.</p>
                
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={insight}
                      onChange={(e) => handleInsightChange(index, e.target.value)}
                      placeholder="핵심 통찰 작성..."
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {insights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInsight(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 제출 버튼 */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  성찰 일지 저장
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">성찰 일지 기록</h2>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {RECENT_REFLECTIONS.map((reflection) => (
                <li key={reflection.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{reflection.title}</h3>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${
                        reflection.type === 'planning' ? 'bg-green-100 text-green-800' :
                        reflection.type === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {reflection.type === 'planning' ? '계획' : 
                       reflection.type === 'monitoring' ? '모니터링' : '평가'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 mb-3">
                    <span>{reflection.subject}</span>
                    <span>{reflection.date}</span>
                  </div>
                  
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">핵심 통찰:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {reflection.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600">{insight}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">상세 보기</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-sm text-blue-600 hover:text-blue-800">수정하기</button>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">총 {RECENT_REFLECTIONS.length}개의 성찰 일지</span>
                <button className="text-sm text-blue-600 hover:text-blue-800">모든 기록 보기</button>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default Reflection; 