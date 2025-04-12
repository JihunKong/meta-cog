import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  // 로컬 스토리지에서 인증 상태 확인
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // 인증되지 않은 경우 로그인 페이지로 리디렉션
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <Outlet />;
}

export default ProtectedRoute; 