"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";

export default function SubjectsList() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subjects");
      
      if (!response.ok) {
        throw new Error("과목 목록을 불러오는데 실패했습니다.");
      }
      
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      } else {
        throw new Error(data.error?.message || "과목 목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("과목 로딩 오류:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubject.trim()) {
      toast.error("과목명을 입력해주세요.");
      return;
    }

    // 중복 확인
    if (subjects.includes(newSubject)) {
      toast.error("이미 존재하는 과목입니다.");
      return;
    }

    setIsAdding(true);
    
    try {
      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newSubject }),
      });
      
      if (!response.ok) {
        throw new Error("과목 추가에 실패했습니다.");
      }
      
      const data = await response.json();
      if (data.success) {
        setSubjects([...subjects, newSubject]);
        setNewSubject("");
        toast.success("과목이 추가되었습니다.");
      } else {
        throw new Error(data.error?.message || "과목 추가에 실패했습니다.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  async function handleDeleteSubject(subjectName: string) {
    if (!confirm(`정말로 '${subjectName}' 과목을 삭제하시겠습니까?`)) {
      return;
    }
    
    setDeleting(prev => ({ ...prev, [subjectName]: true }));
    
    try {
      const response = await fetch(`/api/admin/subjects/${encodeURIComponent(subjectName)}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '과목 삭제 중 오류가 발생했습니다');
      }
      
      toast.success(`${subjectName} 과목이 삭제되었습니다`);
      
      // 과목 목록에서 삭제된 과목 제거
      setSubjects(subjects.filter(subject => subject !== subjectName));
    } catch (error) {
      console.error('과목 삭제 중 오류:', error);
      toast.error(error instanceof Error ? error.message : '과목 삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(prev => ({ ...prev, [subjectName]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong className="font-medium">오류 발생:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleAddSubject} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="새 과목 이름"
            className="flex-1 p-2 border rounded-md"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            disabled={isAdding}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            disabled={isAdding || !newSubject.trim()}
          >
            {isAdding ? (
              <>
                <Icons.spinner className="animate-spin h-4 w-4" />
                <span>추가 중...</span>
              </>
            ) : (
              "과목 추가"
            )}
          </button>
        </div>
      </form>

      {subjects.length === 0 ? (
        <p className="text-center py-4 text-gray-500">등록된 과목이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject}
              className="border rounded-md p-4 flex justify-between items-center bg-gray-50"
            >
              <span className="font-medium text-gray-800">{subject}</span>
              <button
                onClick={() => handleDeleteSubject(subject)}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:hover:text-red-600"
                disabled={deleting[subject]}
              >
                {deleting[subject] ? "삭제 중..." : "삭제"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 