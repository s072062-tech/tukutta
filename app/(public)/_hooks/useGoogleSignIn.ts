// Google認証の開始処理を行い、認証の待ち・失敗状態を渡すフック
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const OAUTH_ERROR_MESSAGE = "Google認証を開始できませんでした。時間をおいて再度お試しください。";

export function useGoogleSignIn() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    // 既に処理中の場合はreturn
    if (isRedirecting) {
      return;
    }
    setIsRedirecting(true);
    setError(null);

    // 認証サインイン
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

    // エラー処理
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGE);
      setIsRedirecting(false);
    }
  };

  return { signIn, isRedirecting, error };
}
