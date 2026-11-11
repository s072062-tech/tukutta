// ユーザー情報画面のプロフィールカードコンポーネント
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import type { MuteUserResponse } from "@/app/api/users/[userId]/mute/route";
import type { GetUserResponse } from "@/app/api/users/[userId]/route";
import { Avatar } from "@/app/_components/common/Avatar";
import { FollowButton } from "@/app/_components/common/FollowButton";
import { MuteButton } from "@/app/_components/common/MuteButton";
import { formatHandle } from "@/lib/format";
import Link from "next/link";

type ProfileCardProps = {
  profile: GetUserResponse;
  onFollowChange: (result: FollowUserResponse) => void;
  onMuteChange: (result: MuteUserResponse) => void;
};

export function ProfileCard({ profile, onFollowChange, onMuteChange }: ProfileCardProps) {
  const { user, followingCount, followerCount, isSelf, isFollowing, isMuted } = profile;

  return (
    <section className="rounded-2xl border border-[#DEE7E9] bg-white p-6">
      <div className="flex items-start gap-4">
        <Avatar name={user.name} id={user.id} userId={user.userId} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-[#1C2B2E]">{user.name}</h1>
              <p className="mt-1 text-sm text-[#6A7B82]">{formatHandle(user.userId)}</p>
            </div>
            {!isSelf ? (
              <div className="flex shrink-0 items-center gap-2">
                <FollowButton
                  userId={user.userId}
                  isFollowing={isFollowing}
                  onChange={onFollowChange}
                />
                <MuteButton userId={user.userId} isMuted={isMuted} onChange={onMuteChange} />
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#1C2B2E]">
            <Link
              href={`/users/${user.userId}/follows?type=following`}
              className="hover:underline"
            >
              フォロー <span className="font-bold">{followingCount}</span>
            </Link>
            <Link
              href={`/users/${user.userId}/follows?type=followers`}
              className="hover:underline"
            >
              フォロワー <span className="font-bold">{followerCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
