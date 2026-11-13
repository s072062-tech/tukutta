// タスク一覧タブの登録フォーム・件数・行・空状態
"use client";

import type { GetProjectResponse } from "@/app/api/projects/[projectId]/route";
import { EmptyState } from "@/app/_components/common/EmptyState";
import { TaskCreateForm } from "./TaskCreateForm";
import { TaskRow } from "./TaskRow";

type TaskSectionProps = {
  projectId: string;
  tasks: GetProjectResponse["tasks"];
  isOwner: boolean;
  onCreated: () => Promise<void>;
};

export function TaskSection({ projectId, tasks, isOwner, onCreated }: TaskSectionProps) {
  const numericId = Number(projectId);

  return (
    <div className="flex flex-col gap-4">
      {isOwner && Number.isInteger(numericId) ? (
        <TaskCreateForm projectId={numericId} onCreated={onCreated} />
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-[#1C2B2E]">タスク {tasks.length}</h2>
        <p className="mt-1 text-xs text-[#6A7B82]">
          ステータスは進捗投稿から更新できます
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState message="まだタスクがありません" />
      ) : (
        <div className="rounded-2xl border border-[#DEE7E9] bg-white px-4">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              projectId={projectId}
              task={task}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
}
