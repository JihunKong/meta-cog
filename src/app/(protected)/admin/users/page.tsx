import { Metadata } from "next";
import UsersClient from "./UsersClient";

export const metadata: Metadata = {
  title: "사용자 관리 - MetaCog",
  description: "사용자 관리 페이지입니다.",
};

// 정적 생성 비활성화
export const dynamic = "force-dynamic";

export default function UsersPage() {
  return <UsersClient />;
} 