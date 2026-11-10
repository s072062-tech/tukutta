// 操作の直前にログイン状態を確認し、未ログインならログイン／プロフィール登録へ誘導するフック
"use client";

import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";

export function useLoginGuard() {
  const { status } = useAuth();
  const router = useRouter();

  // 未ログインやプロフィール未登録ならリダイレクトし、操作を続行するか判定
  const ensureLoggedIn = () => {
    if (status === "guest") {
      router.push("/login");
      return false;
    }
    if (status === "noProfile") {
      router.push("/signup?step=profile");
      return false;
    }
    return status === "ready";
  };

  return { ensureLoggedIn };
}
