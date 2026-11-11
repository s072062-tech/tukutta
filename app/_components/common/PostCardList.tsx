// 投稿一覧のリスト表示コンポーネント
"use client";

import type { FavoriteResponse } from "@/app/api/posts/[postId]/favorite/route";
import { EmptyState } from "./EmptyState";
import { LoadMoreButton } from "./LoadMoreButton";
import { PostCard } from "./PostCard";
import type { PostCard as PostCardData } from "@/types/post";

type PostCardListProps = {
  posts: PostCardData[];
  emptyMessage: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onFavoriteChange?: (postId: number, result: FavoriteResponse) => void;
};

export function PostCardList({
  posts,
  emptyMessage,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onFavoriteChange,
}: PostCardListProps) {
  if (posts.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onFavoriteChange={onFavoriteChange} />
      ))}
      <LoadMoreButton hasMore={hasMore} isLoading={isLoadingMore} onClick={onLoadMore} />
    </div>
  );
}
