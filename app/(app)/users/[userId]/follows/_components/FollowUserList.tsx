// フォロー一覧の行一覧・空表示・「もっと見る」をまとめて描画するコンポーネント
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import type { FollowListItem } from "@/app/api/users/[userId]/follows/route";
import { EmptyState } from "@/app/_components/common/EmptyState";
import { LoadMoreButton } from "@/app/_components/common/LoadMoreButton";
import { FollowUserRow } from "./FollowUserRow";

type FollowUserListProps = {
  users: FollowListItem[];
  emptyMessage: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onFollowChange: (userId: string, result: FollowUserResponse) => void;
};

// ユーザー配列を一覧UIとして表示
export function FollowUserList({
  users,
  emptyMessage,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onFollowChange,
}: FollowUserListProps) {
  if (users.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#DEE7E9] bg-white">
      <ul className="divide-y divide-[#DEE7E9]">
        {users.map((user) => (
          <li key={user.id}>
            <FollowUserRow
              user={user}
              onFollowChange={(result) => onFollowChange(user.userId, result)}
            />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="border-t border-[#DEE7E9] px-4 py-3">
          <LoadMoreButton
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onClick={onLoadMore}
          />
        </div>
      ) : null}
    </div>
  );
}
