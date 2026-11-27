// 投稿やプロジェクトの一覧が0件の場合の表示コンポーネント
"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  message: string;
  action?: ReactNode;
};

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <p className="text-sm text-fg-muted">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
