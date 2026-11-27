// フォロー/フォロワー一覧の1行を描画するコンポーネント
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import type { FollowListItem } from "@/app/api/users/[userId]/follows/route";
import { Avatar } from "@/app/_components/common/Avatar";
import { FollowButton } from "@/app/_components/common/FollowButton";
import { formatHandle } from "@/lib/format";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

type FollowUserRowProps = {
  user: FollowListItem;
  onFollowChange: (result: FollowUserResponse) => void;
};

// ユーザー1人分の行UIを描画する
export function FollowUserRow({ user, onFollowChange }: FollowUserRowProps) {
  const router = useRouter();

  // 詳細ページへ遷移
  const goToProfile = () => {
    router.push(`/users/${user.userId}`);
  };

  // フォローボタン操作が行クリック扱いになるのを防ぐ
  const stopRowNavigation = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${user.name} ${formatHandle(user.userId)}`}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-surface-muted"
      onClick={goToProfile}
    >
      <Avatar
        name={user.name}
        id={user.id}
        userId={user.userId}
        size="sm"
        linked={false}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-fg">{user.name}</p>
        <p className="truncate text-sm text-fg-muted">{formatHandle(user.userId)}</p>
      </div>
      {!user.isSelf ? (
        <div
          className="shrink-0"
          onClick={stopRowNavigation}
          onKeyDown={stopRowNavigation}
        >
          <FollowButton
            userId={user.userId}
            isFollowing={user.isFollowing}
            onChange={onFollowChange}
          />
        </div>
      ) : null}
    </div>
  );
}
