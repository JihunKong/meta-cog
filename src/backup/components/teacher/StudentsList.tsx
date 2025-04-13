import { apiCall } from "@/lib/api-service";

const fetchUsers = async () => {
  try {
    setLoading(true);
    const data = await apiCall<{success: boolean; data: User[]}>('/api/teacher/users');
    
    if (data.success) {
      setUsers(data.data);
    } else {
      console.error('사용자 목록을 불러오는데 실패했습니다.', data.error);
      setError('사용자 목록을 불러오는데 실패했습니다.');
    }
  } catch (err) {
    console.error('사용자 목록 가져오기 오류:', err);
    setError('사용자 목록을 불러오는데 실패했습니다.');
  } finally {
    setLoading(false);
  }
};

const updateUserRole = async (userId: string, newRole: Role) => {
  try {
    const data = await apiCall<{success: boolean; data: User}>(`/api/teacher/users/${userId}`, {
      method: 'PATCH',
      body: { role: newRole }
    });
    
    if (data.success) {
      // 사용자 목록에서 해당 사용자 업데이트
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      toast.success('사용자 역할이 업데이트되었습니다.');
    } else {
      console.error('사용자 역할 업데이트 실패:', data.error);
      toast.error('사용자 역할을 업데이트하는데 실패했습니다.');
    }
  } catch (err) {
    console.error('사용자 역할 업데이트 오류:', err);
    toast.error('사용자 역할을 업데이트하는데 실패했습니다.');
  }
}; 