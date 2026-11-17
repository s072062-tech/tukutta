// 指定ユーザーのフォロー中／フォロワー一覧を無限スクロールで取得するフック
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import type {
  FollowListItem,
  FollowListType,
  GetUserFollowsResponse,
} from "@/app/api/users/[userId]/follows/route";
import { ApiClientError } from "@/lib/apiClient";
import useSWRInfinite from "swr/infinite";

// フォロー一覧の取得状態と操作をまとめて返す
export function useFollowList(
  userId: string | undefined,
  type: FollowListType,
  enabled: boolean,
) {
  // SWR Infinite 用に次に取るページのAPI URLを決める
  const getKey = (
    pageIndex: number,
    previousPageData: GetUserFollowsResponse | null,
  ) => {
    if (!enabled || typeof userId !== "string" || userId.length === 0) {
      return null;
    }
    if (previousPageData && previousPageData.nextCursor === null) {
      return null;
    }
    const base = `/api/users/${encodeURIComponent(userId)}/follows?type=${type}`;
    if (pageIndex === 0) {
      return base;
    }
    return `${base}&cursor=${previousPageData!.nextCursor}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<GetUserFollowsResponse>(getKey);

  const users: FollowListItem[] = data ? data.flatMap((page) => page.items) : [];
  const lastPage = data?.[data.length - 1];
  const hasMore = Boolean(lastPage?.nextCursor);
  const isLoadingMore = Boolean(isValidating && data && size > 1);

  // 続きがあるときだけ次ページを読み込む
  const loadMore = () => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    void setSize(size + 1);
  };

  // 対象ユーザーのisFollowingをキャッシュ上で即時更新する
  const updateFollow = (targetUserId: string, result: FollowUserResponse) => {
    void mutate(
      (pages) =>
        pages?.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.userId === targetUserId
              ? { ...item, isFollowing: result.isFollowing }
              : item,
          ),
        })),
      { revalidate: false },
    );
  };

  return {
    users,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error: error instanceof Error ? error : null,
    isNotFound: error instanceof ApiClientError && error.status === 404,
    mutate,
    updateFollow,
  };
}
