// 画面がログイン状態を GET /api/user-self で取得するフック
// status : 
//  loading   (/api/user-self処理中),  
//  guest     (未ログイン), 
//  noProfile (認証済み、プロフィール未登録), 
//  ready     (ログイン済み、プロフィールあり)
"use client";

import type { GetMeResponse, UserSelf } from "@/app/api/user-self/route";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import useSWR from "swr";

// ログイン状態を status、me(プロフィール)、mutate(再取得関数) で返す
export function useAuth() {
  const { data, isLoading, mutate } = useSWR<GetMeResponse>("/api/user-self");

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // supabaseのサインイン,サインアウトでログイン状態を再取得する
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        void mutate();
      }
    });
    return () => subscription.unsubscribe();
  }, [mutate]);

  const status = data ? data.status : isLoading ? "loading" : "guest";
  const me: UserSelf | null = data?.status === "ready" ? data.user : null;

  return { status, me, mutate };
}
