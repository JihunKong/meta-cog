"use client";

import StudyPlansClient from "./StudyPlansClient";

export default function StudentStudyPlansPage({ params }: { params: { id: string } }) {
  return <StudyPlansClient studentId={params.id} />;
} 