// プロジェクト編集画面 (/projects/{projectId}/edit)（登録ユーザーのみ）
"use client";

import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { useRequireAuth } from "@/app/_hooks/useRequireAuth";
import { useParams } from "next/navigation";
import { ProjectEditView } from "./_components/ProjectEditView";

function isPositiveIntString(value: string) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 && String(num) === value;
}

export default function ProjectEditPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";
  const { isReady } = useRequireAuth();

  if (!isReady) {
    return <LoadingState variant="page" />;
  }

  if (!isPositiveIntString(projectId)) {
    return <NotFoundState />;
  }

  return <ProjectEditView projectId={projectId} enabled={isReady} />;
}
