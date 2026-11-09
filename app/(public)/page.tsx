// トップ (/)
"use client";

import { LoadingState } from "@/app/_components/common/LoadingState";
import { useGuestOnly } from "./_hooks/useGuestOnly";

export default function TopPage() {
  // ログイン済みユーザーはフックで/homeに遷移させる
  const { status } = useGuestOnly();

  // loading, ready 状態の場合はローディングコンポーネント表示
  if (status === "loading" || status === "ready") {
    return <LoadingState variant="page" />;
  }

  return <div />;
}
