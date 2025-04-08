import { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "시스템 설정 - 청해FLAME",
  description: "시스템 설정 및 환경 관리 페이지입니다.",
};

export default function SettingsPage() {
  return <SettingsClient />;
} 