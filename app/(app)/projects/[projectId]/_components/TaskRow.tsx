// タスク1行（名前・ステータス・登録者向け編集リンク）
"use client";

import { StatusBadge } from "@/app/_components/common/StatusBadge";
import type { TaskStatus } from "@/types/task";
import { ListChecks, Pencil } from "lucide-react";
import Link from "next/link";

type TaskRowProps = {
  projectId: string;
  task: { id: number; name: string; status: TaskStatus };
  isOwner: boolean;
};

export function TaskRow({ projectId, task, isOwner }: TaskRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[#DEE7E9] py-3 last:border-b-0">
      <ListChecks className="h-4 w-4 shrink-0 text-[#0F6E6B]" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-sm text-[#1C2B2E]">{task.name}</p>
      <StatusBadge status={task.status} />
      {isOwner ? (
        <Link
          href={`/projects/${projectId}/tasks/${task.id}/edit`}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#0F6E6B] hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          編集
        </Link>
      ) : null}
    </div>
  );
}
