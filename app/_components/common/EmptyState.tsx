// 投稿やプロジェクトの一覧が0件の場合の表示コンポーネント
"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  message: string;
  action?: ReactNode;
};

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#DEE7E9] bg-white px-6 py-10 text-center">
      <p className="text-sm text-[#6A7B82]">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
