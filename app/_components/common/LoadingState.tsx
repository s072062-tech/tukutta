// データの取得中や画面の切り替え待ちに表示するLoading状態コンポーネント
"use client";

import { Loader2 } from "lucide-react";   // ローディングアイコン表示

type LoadingStateProps = {
  variant: "list" | "card" | "page";
};

// variantの設定に対して、(page)ページ全体, (card)カード1枚, (list)一覧3行 を表示する
export function LoadingState({ variant }: LoadingStateProps) {
  if (variant === "page") {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status" aria-label="読み込み中">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F6E6B]" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="h-40 animate-pulse rounded-2xl bg-[#E4EBED]" role="status" aria-label="読み込み中" />
    );
  }

  return (
    <div className="flex flex-col gap-3" role="status" aria-label="読み込み中">
      <div className="h-24 animate-pulse rounded-xl bg-[#E4EBED]" />
      <div className="h-24 animate-pulse rounded-xl bg-[#E4EBED]" />
      <div className="h-24 animate-pulse rounded-xl bg-[#E4EBED]" />
    </div>
  );
}
