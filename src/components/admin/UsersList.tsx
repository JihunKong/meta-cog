"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as "ADMIN" | "STUDENT" | "TEACHER"
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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

  const handleCreateUser = async () => {
    // 입력 검증
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    setIsCreatingUser(true);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "사용자 생성에 실패했습니다.");
      }
      
      const data = await response.json();
      
      // 사용자 목록에 새 사용자 추가
      setUsers(prevUsers => [...prevUsers, data.data]);
      
      // 입력 필드 초기화
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "STUDENT"
      });
      
      // 다이얼로그 닫기
      setIsAddUserDialogOpen(false);
      
      toast.success("사용자가 성공적으로 생성되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) {
      toast.error("사용자 ID와 새 비밀번호가 필요합니다.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsResettingPassword(true);
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "비밀번호 재설정에 실패했습니다.");
      }
      
      // 다이얼로그 닫기 및 상태 초기화
      setIsResetPasswordDialogOpen(false);
      setSelectedUserId(null);
      setNewPassword("");
      
      toast.success("비밀번호가 성공적으로 재설정되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsResettingPassword(false);
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
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            className="w-full p-2 border rounded-md font-medium text-gray-800 mr-4"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Icons.add className="h-4 w-4 mr-2" />
                사용자 추가
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="user-creation-description">
              <DialogHeader>
                <DialogTitle>새 사용자 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p id="user-creation-description" className="text-sm text-gray-600 mb-2">
                  새 사용자 정보를 입력하세요.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input 
                    id="name" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="사용자 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="사용자 이메일"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="초기 비밀번호"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">역할</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value: "ADMIN" | "STUDENT" | "TEACHER") => 
                      setNewUser({...newUser, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">학생</SelectItem>
                      <SelectItem value="TEACHER">교사</SelectItem>
                      <SelectItem value="ADMIN">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleCreateUser} 
                    disabled={isCreatingUser}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreatingUser ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : "사용자 생성"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent aria-describedby="password-reset-description">
          <DialogHeader>
            <DialogTitle>비밀번호 재설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p id="password-reset-description" className="text-sm text-gray-600 mb-2">
              사용자의 새 비밀번호를 입력하세요.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input 
                id="newPassword" 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (최소 6자)"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleResetPassword} 
                disabled={isResettingPassword || !newPassword || newPassword.length < 6}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isResettingPassword ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    재설정 중...
                  </>
                ) : "비밀번호 재설정"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
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
                    
                    <button
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setNewPassword("");
                        setIsResetPasswordDialogOpen(true);
                      }}
                      className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-bold text-xs"
                    >
                      비밀번호 재설정
                    </button>
                    
                    {roleChanging[user.id] ? (
                      <span className="text-gray-400">변경 중...</span>
                    ) : (
                      <div className="relative group">
                        <button className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold text-xs">
                          역할 변경
                        </button>
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg overflow-hidden z-50 hidden group-hover:block border border-gray-200">
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleRoleChange(user.id, 'ADMIN')}
                              className="block w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-blue-50 font-medium"
                            >
                              관리자로
                            </button>
                          )}
                          {user.role !== 'TEACHER' && (
                            <button
                              onClick={() => handleRoleChange(user.id, 'TEACHER')}
                              className="block w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-blue-50 font-medium"
                            >
                              교사로
                            </button>
                          )}
                          {user.role !== 'STUDENT' && (
                            <button
                              onClick={() => handleRoleChange(user.id, 'STUDENT')}
                              className="block w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-blue-50 font-medium"
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