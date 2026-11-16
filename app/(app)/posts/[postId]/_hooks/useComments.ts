// 投稿コメントのツリーをSWRで取得するフック
"use client";

import type { GetCommentsResponse } from "@/app/api/posts/[postId]/comments/route";
import { ApiClientError } from "@/lib/apiClient";
import useSWR from "swr";

type UseCommentsOptions = {
  enabled?: boolean;
};

export function useComments(postId: number | null, options: UseCommentsOptions = {}) {
  const enabled = options.enabled ?? true;
  const key =
    enabled && postId != null && Number.isInteger(postId) && postId > 0
      ? `/api/posts/${postId}/comments`
      : null;

  const { data, error, isLoading, mutate } = useSWR<GetCommentsResponse>(key);

  return {
    comments: data?.comments ?? [],
    isLoading,
    error: error instanceof ApiClientError ? error : error instanceof Error ? error : undefined,
    mutate,
  };
}
