// ユーザー情報へ遷移するユーザー名リンクを表示するコンポーネント
"use client";

import type { UserSummary } from "@/types/user";
import Link from "next/link";

type UserNameLinkProps = {
  user: UserSummary;
};

export function UserNameLink({ user }: UserNameLinkProps) {
  return (
    <Link href={`/users/${user.userId}`} className="block min-w-0">
      <span className="block truncate text-sm font-medium text-fg">{user.name}</span>
      <span className="block truncate text-xs text-fg-muted">@{user.userId}</span>
    </Link>
  );
}
