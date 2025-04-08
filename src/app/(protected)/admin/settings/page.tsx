import { Metadata } from "next";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "시스템 설정 - 청해FLAME",
  description: "시스템 설정 및 환경 관리 페이지입니다.",
};

export const dynamic = 'force-dynamic';

function SettingsPage() {
  return <SettingsClient />;
}

export default withAdminAuth(SettingsPage, { metadata }); 