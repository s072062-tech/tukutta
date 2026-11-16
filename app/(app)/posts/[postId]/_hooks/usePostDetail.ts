// 投稿詳細をSWRで取得するフック
"use client";

import type { GetPostResponse } from "@/app/api/posts/[postId]/route";
import { ApiClientError } from "@/lib/apiClient";
import useSWR from "swr";

function isPositiveInt(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function usePostDetail(postId: number | null) {
  const key = postId != null && isPositiveInt(postId) ? `/api/posts/${postId}` : null;
  const { data, error, isLoading, mutate } = useSWR<GetPostResponse>(key);

  return {
    post: data?.post ?? null,
    isLoading,
    isNotFound: error instanceof ApiClientError && error.status === 404,
    error: error instanceof ApiClientError ? error : error instanceof Error ? error : undefined,
    mutate,
  };
}
