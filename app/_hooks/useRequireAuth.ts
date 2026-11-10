// ページ表示時にログイン必須を強制し、未ログインなら適切な画面へ誘導するフック
"use client";

import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRequireAuth() {
  const { status, me } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // guestの場合はログインへ
    if (status === "guest") {
      router.replace("/login");
    // noProfileの場合はプロフィール登録
    } else if (status === "noProfile") {
      router.replace("/signup?step=profile");
    }
  }, [router, status]);

  return { isReady: status === "ready", me };
}
