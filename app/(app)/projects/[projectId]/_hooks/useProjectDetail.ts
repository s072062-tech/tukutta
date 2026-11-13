// プロジェクト詳細を SWR で取得するフック（編集画面からも再利用）
"use client";

import type { GetProjectResponse } from "@/app/api/projects/[projectId]/route";
import { ApiClientError } from "@/lib/apiClient";
import useSWR from "swr";

type UseProjectDetailOptions = {
  enabled?: boolean;
};

export function useProjectDetail(
  projectId: string | undefined,
  options: UseProjectDetailOptions = {},
) {
  const enabled = options.enabled ?? true;
  const key =
    enabled && typeof projectId === "string" && projectId.length > 0
      ? `/api/projects/${encodeURIComponent(projectId)}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<GetProjectResponse>(key);

  return {
    detail: data ?? null,
    isLoading,
    isNotFound: error instanceof ApiClientError && error.status === 404,
    error: error instanceof ApiClientError ? error : error instanceof Error ? error : undefined,
    mutate,
  };
}
