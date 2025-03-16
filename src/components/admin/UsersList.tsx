"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";

// User 타입 정의
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "STUDENT" | "TEACHER";
  image?: string | null;
  emailVerified?: Date | null;
}

interface UsersListProps {
  limit?: number;
  showFilters?: boolean;
}

export default function UsersList({ limit, showFilters }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`/api/admin/users${limit ? `?limit=${limit}` : ''}`);
        
        if (!response.ok) {
          throw new Error("사용자 목록을 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        setUsers(data.data || []);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, [limit]);

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "STUDENT" | "TEACHER") => {
    setRoleChanging((prev) => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error("역할 변경에 실패했습니다.");
      }
      
      const data = await response.json();
      if (data.success) {
        // 성공적으로 역할이 변경된 경우, 사용자 목록을 업데이트
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
        toast.success("역할이 변경되었습니다.");
      } else {
        throw new Error(data.error?.message || "역할 변경에 실패했습니다.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRoleChanging((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    
    setDeleting((prev) => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("사용자 삭제에 실패했습니다.");
      }
      
      const data = await response.json();
      if (data.success) {
        // 성공적으로 삭제된 경우, 사용자 목록에서 제거
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        toast.success("사용자가 삭제되었습니다.");
      } else {
        throw new Error(data.error?.message || "사용자 삭제에 실패했습니다.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleResetUserData = async (userId: string) => {
    if (!confirm("정말로 이 사용자의 모든 학습 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-data`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("데이터 초기화에 실패했습니다.");
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success("사용자의 학습 데이터가 초기화되었습니다.");
      } else {
        throw new Error(data.error?.message || "데이터 초기화에 실패했습니다.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">오류 발생:</strong>
        <span className="block sm:inline ml-1">{error}</span>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'TEACHER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoleName = (role: string) => {
    switch(role) {
      case 'ADMIN': return '관리자';
      case 'TEACHER': return '교사';
      default: return '학생';
    }
  };

  return (
    <div>
      {showFilters && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            className="w-full p-2 border rounded-md font-medium text-gray-800"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                사용자
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                이메일
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                역할
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.image ? (
                        <img className="h-10 w-10 rounded-full" src={user.image} alt={user.name || ""} />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-700 font-bold">{user.name?.[0] || "?"}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-800">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    {user.role === 'STUDENT' && (
                      <button
                        onClick={() => handleResetUserData(user.id)}
                        className="px-2 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-bold text-xs"
                      >
                        데이터 초기화
                      </button>
                    )}
                    
                    {roleChanging[user.id] ? (
                      <span className="text-gray-400">변경 중...</span>
                    ) : (
                      <div className="relative group">
                        <button className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold text-xs">
                          역할 변경
                        </button>
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block">
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleRoleChange(user.id, 'ADMIN')}
                              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            >
                              관리자로
                            </button>
                          )}
                          {user.role !== 'TEACHER' && (
                            <button
                              onClick={() => handleRoleChange(user.id, 'TEACHER')}
                              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            >
                              교사로
                            </button>
                          )}
                          {user.role !== 'STUDENT' && (
                            <button
                              onClick={() => handleRoleChange(user.id, 'STUDENT')}
                              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            >
                              학생으로
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleting[user.id]}
                      className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-bold text-xs disabled:opacity-50"
                    >
                      {deleting[user.id] ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? "검색 결과가 없습니다." : "사용자가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 