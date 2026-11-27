// ログイン中ユーザーのミュート一覧を無限スクロールで取得するフック
"use client";

import type { GetMutedUsersResponse } from "@/app/api/user-self/mutes/route";
import type { MutedListItem } from "@/app/api/user-self/mutes/route";
import useSWRInfinite from "swr/infinite";

const MUTES_KEY = "/api/user-self/mutes";

export function useMutedUsers() {
  const getKey = (
    pageIndex: number,
    previousPageData: GetMutedUsersResponse | null,
  ) => {
    if (previousPageData && previousPageData.nextCursor === null) {
      return null;
    }
    if (pageIndex === 0) {
      return MUTES_KEY;
    }
    return `${MUTES_KEY}?cursor=${previousPageData!.nextCursor}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<GetMutedUsersResponse>(getKey);

  const users: MutedListItem[] = data ? data.flatMap((page) => page.items) : [];
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
    users,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error: error instanceof Error ? error : null,
    mutate,
  };
}
