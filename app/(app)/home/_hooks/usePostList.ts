// ホームの投稿タイムラインを無限スクロールで取得するフック
"use client";

import type { FavoriteResponse } from "@/app/api/posts/[postId]/favorite/route";
import type { GetPostsResponse } from "@/app/api/posts/route";
import type { AuthStatus } from "@/app/_hooks/useAuth";
import type { PostListTab } from "@/lib/validations/post";
import type { PostCard } from "@/types/post";
import { ApiClientError } from "@/lib/apiClient";
import { mutate as globalMutate } from "swr";
import useSWRInfinite from "swr/infinite";

// /api/posts 系の一覧キャッシュ（無限スクロール用含む）をまとめて再検証する
export function revalidatePostLists() {
  return globalMutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith("/api/posts");
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        const head = key[0];
        return head.startsWith("/api/posts") || head.startsWith("$inf$/api/posts");
      }
      return false;
    },
    undefined,
    { revalidate: true },
  );
}

type UsePostListArgs = {
  tab: PostListTab;
  q: string | null;
  status: AuthStatus;
};

// tab / q に応じた投稿一覧と、追加読み込み・お気に入り更新を返す
export function usePostList({ tab, q, status }: UsePostListArgs) {
  const enabled =
    (tab !== "following" && tab !== "favorites") || status === "ready";

  // ページ番号と前回レスポンスから次に取る /api/posts のURLを決める
  const getKey = (pageIndex: number, previousPageData: GetPostsResponse | null) => {
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
    return `/api/posts?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<GetPostsResponse>(getKey);

  const posts: PostCard[] = data ? data.flatMap((page) => page.items) : [];
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

  // 指定投稿のお気に入り状態と件数をキャッシュ上で即時更新する
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
    error: error instanceof ApiClientError ? error : undefined,
    mutate,
    updateFavorite,
  };
}
