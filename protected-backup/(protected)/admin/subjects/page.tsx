"use client";

import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import SubjectsClient from "./SubjectsClient";


export const dynamic = 'force-dynamic';

function SubjectsPage() {
  return <SubjectsClient />;
}

export default withAdminAuth(SubjectsPage, { metadata }); 