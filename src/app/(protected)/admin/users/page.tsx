import { Metadata } from "next";
import UsersClient from "./UsersClient";

export const metadata: Metadata = {
  title: "사용자 관리 - MetaCog",
  description: "사용자 관리 페이지입니다.",
};

export default function UsersPage() {
  return <UsersClient />;
} 