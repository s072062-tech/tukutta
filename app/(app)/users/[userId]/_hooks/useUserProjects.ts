// ユーザーのプロジェクト一覧取得フック
"use client";

import type { GetUserProjectsResponse } from "@/app/api/users/[userId]/projects/route";
import type { ProjectCard } from "@/types/project";
import useSWR from "swr";

export function useUserProjects(userId: string, enabled: boolean) {
  const key = enabled ? `/api/users/${encodeURIComponent(userId)}/projects` : null;
  const { data, error, isLoading, mutate } = useSWR<GetUserProjectsResponse>(key);

  return {
    projects: (data ?? []) as ProjectCard[],
    isLoading,
    error: error instanceof Error ? error : null,
    mutate,
  };
}
