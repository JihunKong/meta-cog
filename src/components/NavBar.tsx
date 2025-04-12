import { Link, useNavigate, useLocation } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem('userEmail');
  
  const handleLogout = () => {
    // 로그아웃 시 로컬 스토리지 데이터 삭제
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    
    // 로그인 페이지로 리디렉션
    navigate('/login');
  };
  
  // 현재 경로에 따라 네비게이션 링크에 활성 스타일 적용
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-800 text-white' : 'text-gray-100 hover:bg-blue-700 hover:text-white';
  };

  return (
    <nav className="bg-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white font-bold text-xl">메타인지 학습 플랫폼</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>
                  대시보드
                </Link>
                <Link to="/goals" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/goals')}`}>
                  SMART 목표 설정
                </Link>
                <Link to="/monitoring" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/monitoring')}`}>
                  학습 모니터링
                </Link>
                <Link to="/reflection" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/reflection')}`}>
                  메타인지 성찰
                </Link>
                <Link to="/feedback" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/feedback')}`}>
                  AI 피드백
                </Link>
                <Link to="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/profile')}`}>
                  내 프로필
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="text-white mr-4">{userEmail}</div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                로그아웃
              </button>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            {/* 모바일 메뉴 버튼 */}
            <button
              type="button"
              className="bg-blue-700 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">메뉴 열기</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}>
            대시보드
          </Link>
          <Link to="/goals" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/goals')}`}>
            SMART 목표 설정
          </Link>
          <Link to="/monitoring" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/monitoring')}`}>
            학습 모니터링
          </Link>
          <Link to="/reflection" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/reflection')}`}>
            메타인지 성찰
          </Link>
          <Link to="/feedback" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/feedback')}`}>
            AI 피드백
          </Link>
          <Link to="/profile" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/profile')}`}>
            내 프로필
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-blue-700">
          <div className="flex items-center px-5">
            <div className="text-base font-medium leading-none text-white">{userEmail}</div>
          </div>
          <div className="mt-3 px-2 space-y-1">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar; 