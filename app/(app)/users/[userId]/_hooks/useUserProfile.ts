// 指定ユーザーのプロフィールをAPIで取得するフック
"use client";

import type { GetUserResponse } from "@/app/api/users/[userId]/route";
import { ApiClientError } from "@/lib/apiClient";
import useSWR from "swr";

export function useUserProfile(userId: string | undefined) {
  const key =
    typeof userId === "string" && userId.length > 0
      ? `/api/users/${encodeURIComponent(userId)}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<GetUserResponse>(key);

  // profile 取得データ（なければ null）, isLoading 読み込み中か, isNotFound 404エラーか
  return {
    profile: data ?? null,
    isLoading,
    isNotFound: error instanceof ApiClientError && error.status === 404,
    error: error instanceof Error ? error : null,
    mutate,
  };
}
