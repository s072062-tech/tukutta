// ユーザー情報画面 (/users/{userId})
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import type { MuteUserResponse } from "@/app/api/users/[userId]/mute/route";
import type { GetUserResponse } from "@/app/api/users/[userId]/route";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { Tabs } from "@/app/_components/common/Tabs";
import { ProfileCard } from "./_components/ProfileCard";
// import { UserProjectsSection } from "./_components/UserProjectsSection";
import { useUserProfile } from "./_hooks/useUserProfile";
import { ApiClientError } from "@/lib/apiClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// タブ設定
const TAB_ITEMS = [
  { key: "projects", label: "プロジェクト" },
  { key: "posts", label: "投稿" },
] as const;

function resolveTab(raw: string | null) {
  return raw === "posts" ? "posts" : "projects";
}

function UserProfilePageContent() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = typeof params.userId === "string" ? params.userId : undefined;
  const activeTab = resolveTab(searchParams.get("tab"));

  const { profile, isLoading, isNotFound, error, mutate } = useUserProfile(userId);

  if (!userId) {
    return <NotFoundState />;
  }

  if (isLoading) {
    return <LoadingState variant="page" />;
  }

  if (isNotFound) {
    return <NotFoundState />;
  }

  if (error || !profile) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            error instanceof ApiClientError
              ? error.message
              : "エラーが発生しました。時間をおいて再度お試しください。"
          }
          onRetry={() => void mutate()}
        />
      </div>
    );
  }

  const handleTabChange = (key: string) => {
    router.replace(`/users/${userId}?tab=${key}`, { scroll: false });
  };

  // ユーザーのフォロー
  const handleFollowChange = (result: FollowUserResponse) => {
    void mutate(
      (current): GetUserResponse | undefined =>
        current
          ? {
              ...current,
              isFollowing: result.isFollowing,
              followerCount: result.followerCount,
            }
          : current,
      { revalidate: false },
    );
  };

  // ユーザーのミュート
  const handleMuteChange = (result: MuteUserResponse) => {
    void mutate(
      (current): GetUserResponse | undefined =>
        current ? { ...current, isMuted: result.isMuted } : current,
      { revalidate: false },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <ProfileCard
        profile={profile}
        onFollowChange={handleFollowChange}
        onMuteChange={handleMuteChange}
      />
      <Tabs items={[...TAB_ITEMS]} activeKey={activeTab} onChange={handleTabChange} />
      {activeTab === "posts" ? (
        // <UserPostsSection userId={userId} />
        <div/ >
      ) : (
        // <UserProjectsSection userId={userId} isSelf={profile.isSelf} />
        <div/ >
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <UserProfilePageContent />
    </Suspense>
  );
}
