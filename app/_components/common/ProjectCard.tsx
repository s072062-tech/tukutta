// プロジェクト1件をカードUIで表示し、詳細ページへ遷移する共通コンポーネント
"use client";

import type { ProjectCard as ProjectCardData } from "@/types/project";
import { ChevronRight, Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ProjectCardProps = {
  project: ProjectCardData;
};

// タスク総数と各ステータス件数を「タスク 3・進行中 1」のような短い文にする
function formatTaskSummary(taskCounts: ProjectCardData["taskCounts"]) {
  if (taskCounts.total === 0) {
    return "タスク 0";
  }

  const parts = [`タスク ${taskCounts.total}`];
  if (taskCounts.未着手 > 0) {
    parts.push(`未着手 ${taskCounts.未着手}`);
  }
  if (taskCounts.進行中 > 0) {
    parts.push(`進行中 ${taskCounts.進行中}`);
  }
  if (taskCounts.完了 > 0) {
    parts.push(`完了 ${taskCounts.完了}`);
  }
  return parts.join("・");
}

// プロジェクト名・登録ユーザー・説明・タスク概要を表示、クリックで詳細へ進む
export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const subtitle = project.description
    ? `${project.owner.name}・${project.description}`
    : project.owner.name;

  return (
    <button
      type="button"
      onClick={() => router.push(`/projects/${project.id}`)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-fg">
        <Gamepad2 className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-accent-fg">{project.name}</p>
        <p className="mt-0.5 truncate text-xs text-fg-muted">{subtitle}</p>
      </div>
      <span className="shrink-0 text-xs text-fg-muted">{formatTaskSummary(project.taskCounts)}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
    </button>
  );
}
