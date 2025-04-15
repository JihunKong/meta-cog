"use client";
import { useEffect, useState } from "react";
import { getUserRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const userRole = await getUserRole();
      setRole(userRole);

      // 관리자면 전체 목록, 아니면 아무것도 안 불러옴
      if (userRole === "ADMIN") {
        const { data, error } = await supabase.from("profiles").select("id, email, role");
        if (error) {
          console.error("관리자 전체 조회 에러:", error);
          setProfiles([]);
        } else {
          setProfiles(data || []);
        }
      } else {
        setProfiles([]); // 학생/교사는 전체 목록 절대 노출 X
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  // 관리자만 전체 목록 렌더링
  if (role === "ADMIN") {
    return (
      <div>
        <h2>관리자 대시보드</h2>
        <table>
          <thead>
            <tr>
              <th>이메일</th>
              <th>권한</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.email}</td>
                <td>{profile.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 교사/학생은 본인 정보만 표시(예시)
  if (role === "TEACHER") {
    return <div>교사 대시보드: 본인 정보만 표시</div>;
  }
  if (role === "STUDENT") {
    return <div>학생 대시보드: 본인 정보만 표시</div>;
  }

  return <div>권한 정보가 없습니다.</div>;
}

