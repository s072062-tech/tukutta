// 未ログイン向けの画面から /home へ遷移するフック
// ログインとプロフィール登録が済んでいるユーザーが対象
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useGuestOnly() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready") {
      router.replace("/home");
    }
  }, [router, status]);

  return { status };
}
