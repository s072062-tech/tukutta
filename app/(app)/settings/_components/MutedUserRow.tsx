// ミュート一覧の1行
"use client";

import type { MutedListItem } from "@/app/api/user-self/mutes/route";
import { Avatar } from "@/app/_components/common/Avatar";
import { MuteButton } from "@/app/_components/common/MuteButton";
import { formatHandle } from "@/lib/format";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

type MutedUserRowProps = {
  user: MutedListItem;
  onUnmute: (userId: string) => void;
};

export function MutedUserRow({ user, onUnmute }: MutedUserRowProps) {
  const router = useRouter();

  const goToProfile = () => {
    router.push(`/users/${user.userId}`);
  };

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
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          goToProfile();
        }
      }}
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
      <div
        className="shrink-0"
        onClick={stopRowNavigation}
        onKeyDown={stopRowNavigation}
      >
        <MuteButton
          userId={user.userId}
          isMuted
          onChange={(result) => {
            if (!result.isMuted) {
              onUnmute(user.userId);
            }
          }}
        />
      </div>
    </div>
  );
}
