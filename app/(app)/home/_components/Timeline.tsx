// ホームのタブ切り替えと投稿カード一覧（空／読込／エラー含む）を表示するコンポーネント
"use client";

import { usePostList } from "@/app/(app)/home/_hooks/usePostList";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { PostCardList } from "@/app/_components/common/PostCardList";
import { Tabs } from "@/app/_components/common/Tabs";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { ApiClientError } from "@/lib/apiClient";
import type { PostListTab } from "@/lib/validations/post";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TAB_ITEMS = [
  { key: "latest", label: "新着" },
  { key: "following", label: "フォロー" },
  { key: "progress", label: "進捗" },
] as const;

type TimelineProps = {
  tab: PostListTab;
  q: string | null;
  onTabChange: (tab: PostListTab) => void;
};

// タブと検索語に応じた「投稿なし」メッセージを返す
function emptyMessage(tab: PostListTab, q: string | null) {
  if (q) {
    return "該当する投稿がありません";
  }
  if (tab === "following") {
    return "フォロー中のユーザーの投稿はありません";
  }
  if (tab === "progress") {
    return "まだ進捗投稿がありません";
  }
  return "まだ投稿がありません";
}

// タブ切替と投稿一覧・空／読込／エラーを表示する
export function Timeline({ tab, q, onTabChange }: TimelineProps) {
  const router = useRouter();
  const { status, mutate: mutateAuth } = useAuth();
  const { ensureLoggedIn } = useLoginGuard();
  const {
    posts,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error,
    mutate,
    updateFavorite,
  } = usePostList({ tab, q, status });

  useEffect(() => {
    if (!error) {
      return;
    }
    if (error.status === 401) {
      void mutateAuth().then(() => {
        router.replace("/login");
      });
      return;
    }
    if (error.status === 403 && error.code === "PROFILE_REQUIRED") {
      router.replace("/signup?step=profile");
    }
  }, [error, mutateAuth, router]);

  const showAuthRedirect =
    tab === "following" &&
    (status === "loading" || status === "guest" || status === "noProfile");
  const showListLoading = !showAuthRedirect && isLoading && posts.length === 0;
  const showError =
    error instanceof ApiClientError &&
    error.status !== 401 &&
    !(error.status === 403 && error.code === "PROFILE_REQUIRED");

  // フォロータブはログイン必須にし、有効なタブなら親の onTabChange を呼ぶ
  const handleTabChange = (key: string) => {
    if (key === "following" && !ensureLoggedIn()) {
      return;
    }
    if (key === "latest" || key === "following" || key === "progress") {
      onTabChange(key);
    }
  };

  return (
    <section className="mt-6">
      <Tabs
        items={[...TAB_ITEMS]}
        activeKey={showAuthRedirect ? "latest" : tab}
        onChange={handleTabChange}
      />

      <div className="mt-4">
        {showAuthRedirect ? <LoadingState variant="list" /> : null}

        {!showAuthRedirect && showListLoading ? (
          <LoadingState variant="list" />
        ) : null}

        {!showAuthRedirect && showError ? (
          <ErrorMessage
            message={error.message || "投稿を読み込めませんでした。"}
            onRetry={() => void mutate()}
          />
        ) : null}

        {!showAuthRedirect && !showListLoading && !showError ? (
          <PostCardList
            posts={posts}
            emptyMessage={emptyMessage(tab, q)}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            onFavoriteChange={updateFavorite}
          />
        ) : null}
      </div>
    </section>
  );
}
