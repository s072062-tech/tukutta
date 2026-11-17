// フォロー一覧の取得・状態表示・行一覧をまとめるコンポーネント
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import type { FollowListType } from "@/app/api/users/[userId]/follows/route";
import { EmptyState } from "@/app/_components/common/EmptyState";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadMoreButton } from "@/app/_components/common/LoadMoreButton";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { ApiClientError } from "@/lib/apiClient";
import { useFollowList } from "../_hooks/useFollowList";
import { FollowUserRow } from "./FollowUserRow";

type FollowUserListProps = {
  userId: string;
  type: FollowListType;
  onFollowChange?: (userId: string, result: FollowUserResponse) => void;
};

// フォロー一覧を取得し、状態に応じて一覧UIを表示する
export function FollowUserList({
  userId,
  type,
  onFollowChange,
}: FollowUserListProps) {
  const {
    users,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error,
    mutate,
    updateFollow,
  } = useFollowList(userId, type, true);

  const emptyMessage =
    type === "followers"
      ? "フォロワーはいません"
      : "フォロー中のユーザーはいません";

  // フォロー変更を一覧キャッシュに反映し、親へ通知する
  const handleFollowChange = (
    targetUserId: string,
    result: FollowUserResponse,
  ) => {
    updateFollow(targetUserId, result);
    void mutate();
    onFollowChange?.(targetUserId, result);
  };

  if (isLoading) {
    return <LoadingState variant="list" />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={
          error instanceof ApiClientError
            ? error.message
            : "エラーが発生しました。時間をおいて再度お試しください。"
        }
        onRetry={() => void mutate()}
      />
    );
  }

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
              onFollowChange={(result) =>
                handleFollowChange(user.userId, result)
              }
            />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="border-t border-[#DEE7E9] px-4 py-3">
          <LoadMoreButton
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onClick={loadMore}
          />
        </div>
      ) : null}
    </div>
  );
}
