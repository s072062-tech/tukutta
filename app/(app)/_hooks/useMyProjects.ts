// 進捗投稿フォーム用に自分のプロジェクト一覧を取得するフック
"use client";

import type { GetMyProjectsResponse } from "@/app/api/me/projects/route";
import { useAuth } from "@/app/_hooks/useAuth";
import { ApiClientError } from "@/lib/apiClient";
import useSWR from "swr";

// enabledかつreadyのときだけ /api/me/projects を取る
export function useMyProjects(enabled: boolean) {
  const { status } = useAuth();
  const key = enabled && status === "ready" ? "/api/me/projects" : null;
  const { data, error, isLoading, mutate } = useSWR<GetMyProjectsResponse>(key);

  return {
    projects: data?.projects ?? [],
    isLoading: Boolean(key) && isLoading,
    error: error instanceof ApiClientError ? error : undefined,
    mutate,
  };
}
