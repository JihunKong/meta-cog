"use client";

import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import SettingsClient from "./SettingsClient";


export const dynamic = 'force-dynamic';

function SettingsPage() {
  return <SettingsClient />;
}

export default withAdminAuth(SettingsPage, { metadata }); 