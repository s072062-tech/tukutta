// プロジェクト一覧をタブ・検索条件付きで取得するフック
"use client";

import type { GetProjectsResponse } from "@/app/api/projects/route";
import type { ProjectCard } from "@/types/project";
import { ApiClientError } from "@/lib/apiClient";
import useSWRInfinite from "swr/infinite";

type AuthStatus = "loading" | "guest" | "noProfile" | "ready";

type UseProjectListArgs = {
  tab: "all" | "following";
  q: string;
  status: AuthStatus;
};

// SWR Infinite のキーと連結済み一覧・件数を返す
export function useProjectList({ tab, q, status }: UseProjectListArgs) {
  const enabled = tab !== "following" || status === "ready";

  const getKey = (pageIndex: number, previousPageData: GetProjectsResponse | null) => {
    if (!enabled) {
      return null;
    }
    if (previousPageData && previousPageData.nextCursor === null) {
      return null;
    }

    const params = new URLSearchParams();
    params.set("tab", tab);
    if (q) {
      params.set("q", q);
    }
    if (pageIndex > 0 && previousPageData?.nextCursor != null) {
      params.set("cursor", String(previousPageData.nextCursor));
    }
    return `/api/projects?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<GetProjectsResponse>(getKey);

  const projects: ProjectCard[] = data ? data.flatMap((page) => page.items) : [];
  const total = data?.[0]?.total ?? null;
  const lastPage = data?.[data.length - 1];
  const hasMore = Boolean(lastPage?.nextCursor);
  const isLoadingMore = Boolean(isValidating && data && size > 1);

  const loadMore = () => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    void setSize(size + 1);
  };

  return {
    projects,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error: error instanceof ApiClientError ? error : undefined,
    mutate,
  };
}
