// エラーメッセージを赤いアラートで表示し、必要なら「再読み込み」ボタンを出す共通コンポーネント
"use client";

import { Button } from "./Button";

type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
};

// messageをアラート表示し、onRetryが有効だと再読み込みボタンを出す
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div role="alert" className="rounded-lg bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">
      <p>{message}</p>
      {onRetry ? (
        <Button type="button" variant="ghost" className="mt-2 h-9 px-2" onClick={onRetry}>
          再読み込み
        </Button>
      ) : null}
    </div>
  );
}
