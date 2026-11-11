// タスク進捗ステータスのバッジコンポーネント
"use client";

import type { TaskStatus } from "@/types/task";
import { Check, Circle, LoaderCircle } from "lucide-react";

type StatusBadgeProps = {
  status: TaskStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "未着手") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#DEE7E9] bg-white px-2 py-0.5 text-xs text-[#6A7B82]">
        <Circle className="h-3 w-3" aria-hidden />
        未着手
      </span>
    );
  }

  if (status === "進行中") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F3F1] px-2 py-0.5 text-xs text-[#0F6E6B]">
        <LoaderCircle className="h-3 w-3" aria-hidden />
        進行中
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F3F1] px-2 py-0.5 text-xs text-[#0F6E6B]">
      <Check className="h-3 w-3" aria-hidden />
      完了
    </span>
  );
}
