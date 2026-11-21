// タスク編集画面用に GET /api/projects/.../tasks/... を取得するフック
"use client";

import type { GetTaskResponse } from "@/app/api/projects/[projectId]/tasks/[taskId]/route";
import { ApiClientError } from "@/lib/apiClient";
import useSWR from "swr";

type UseTaskOptions = {
  enabled?: boolean;
};

export function useTask(
  projectId: string,
  taskId: string,
  options: UseTaskOptions = {},
) {
  const enabled = options.enabled ?? true;
  const key =
    enabled && projectId && taskId
      ? `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<GetTaskResponse>(key);
  const apiError = error instanceof ApiClientError ? error : undefined;

  return {
    task: data,
    isLoading: Boolean(key) && isLoading,
    isNotFound: apiError?.status === 404,
    isForbidden: apiError?.status === 403 && apiError.code === "FORBIDDEN",
    error: apiError ?? (error instanceof Error ? error : undefined),
    mutate,
  };
}
