// ユーザー情報の投稿タブの表示内容コンポーネント
"use client";

import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { PostCardList } from "@/app/_components/common/PostCardList";
import { useUserPosts } from "../_hooks/useUserPosts";
import { ApiClientError } from "@/lib/apiClient";

type UserPostsSectionProps = {
  userId: string;
};

// userIdの投稿を取得し、状態によって読み込み中・エラー・一覧を表示
export function UserPostsSection({ userId }: UserPostsSectionProps) {
  // userIdの投稿情報を取得
  const {
    posts,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error,
    mutate,
    updateFavorite,
  } = useUserPosts(userId, true);

  // 読み込み中
  if (isLoading) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#1C2B2E]">投稿</h2>
        <LoadingState variant="list" />
      </section>
    );
  }

  // エラー
  if (error) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#1C2B2E]">投稿</h2>
        <ErrorMessage
          message={
            error instanceof ApiClientError
              ? error.message
              : "エラーが発生しました。時間をおいて再度お試しください。"
          }
          onRetry={() => void mutate()}
        />
      </section>
    );
  }

  // PostCardListに取得した情報を渡して表示
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-[#1C2B2E]">投稿</h2>
      <PostCardList
        posts={posts}
        emptyMessage="まだ投稿がありません"
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onFavoriteChange={updateFavorite}
      />
    </section>
  );
}
