// タスク編集画面 (/projects/{projectId}/tasks/{taskId}/edit)（登録ユーザーのみ・ステータスは読み取り専用）
"use client";

import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { useRequireAuth } from "@/app/_hooks/useRequireAuth";
import { useParams } from "next/navigation";
import { TaskEditView } from "./_components/TaskEditView";

function isPositiveIntString(value: string) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 && String(num) === value;
}

export default function TaskEditPage() {
  const params = useParams<{ projectId: string; taskId: string }>();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";
  const taskId = typeof params.taskId === "string" ? params.taskId : "";
  const { isReady } = useRequireAuth();

  if (!isReady) {
    return <LoadingState variant="page" />;
  }

  if (!isPositiveIntString(projectId) || !isPositiveIntString(taskId)) {
    return <NotFoundState />;
  }

  return <TaskEditView projectId={projectId} taskId={taskId} enabled={isReady} />;
}
