import { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "계정 설정 - 청해FLAME",
  description: "계정 설정을 관리합니다.",
};

export default function SettingsPage() {
  return <SettingsClient />;
} 