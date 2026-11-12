// プロジェクト一覧画面 (/projects)
"use client";

import { LoadingState } from "@/app/_components/common/LoadingState";
import { Suspense } from "react";
import { ProjectListView } from "./_components/ProjectListView";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<LoadingState variant="list" />}>
      <ProjectListView />
    </Suspense>
  );
}
