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
      <span className="block truncate text-sm font-medium text-[#1C2B2E]">{user.name}</span>
      <span className="block truncate text-xs text-[#6A7B82]">@{user.userId}</span>
    </Link>
  );
}
