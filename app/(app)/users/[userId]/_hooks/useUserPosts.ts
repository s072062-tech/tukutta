// 指定ユーザーの投稿一覧を無限スクロールで取得・管理するフック
"use client";

import type { FavoriteResponse } from "@/app/api/posts/[postId]/favorite/route";
import type { GetUserPostsResponse } from "@/app/api/users/[userId]/posts/route";
import type { PostCard } from "@/types/post";
import useSWRInfinite from "swr/infinite";

// ユーザー投稿一覧の取得状態と操作をまとめて返す
export function useUserPosts(userId: string, enabled: boolean) {

  //  SWR Infinite用に次に取るページのAPI URLを取得
  const getKey = (pageIndex: number, previousPageData: GetUserPostsResponse | null) => {
    if (!enabled) {
      return null;
    }
    if (previousPageData && previousPageData.nextCursor === null) {
      return null;
    }
    const base = `/api/users/${encodeURIComponent(userId)}/posts`;
    if (pageIndex === 0) {
      return base;
    }
    return `${base}?cursor=${previousPageData!.nextCursor}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<GetUserPostsResponse>(getKey);

  const posts: PostCard[] = data ? data.flatMap((page) => page.items) : [];
  const lastPage = data?.[data.length - 1];
  const hasMore = Boolean(lastPage?.nextCursor);
  const isLoadingMore = Boolean(isValidating && data && size > 1);

  // まだ投稿が残っている場合は次ページを読み込む
  const loadMore = () => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    void setSize(size + 1);
  };

  // お気に入り操作の結果を再取得なしでキャッシュ上の該当投稿に反映する
  const updateFavorite = (postId: number, result: FavoriteResponse) => {
    void mutate(
      (pages) =>
        pages?.map((page) => ({
          ...page,
          items: page.items.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isFavorited: result.isFavorited,
                  favoriteCount: result.favoriteCount,
                }
              : post,
          ),
        })),
      { revalidate: false },
    );
  };

  return {
    posts,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error: error instanceof Error ? error : null,
    mutate,
    updateFavorite,
  };
}
