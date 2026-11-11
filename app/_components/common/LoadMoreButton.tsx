// 投稿やプロジェクトの一覧末尾に表示する「もっと見る」ボタンコンポーネント
"use client";

import { Button } from "./Button";

type LoadMoreButtonProps = {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
};

export function LoadMoreButton({ hasMore, isLoading, onClick }: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center pt-2">
      <Button type="button" variant="secondary" isLoading={isLoading} onClick={onClick}>
        もっと見る
      </Button>
    </div>
  );
}
