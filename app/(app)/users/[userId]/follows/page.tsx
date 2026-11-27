// フォロー/フォロワー 一覧 (/users/[userId]/follows)
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import type { FollowListType } from "@/app/api/users/[userId]/follows/route";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { Tabs } from "@/app/_components/common/Tabs";
import { ApiClientError } from "@/lib/apiClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useUserProfile } from "../_hooks/useUserProfile";
import { FollowUserList } from "./_components/FollowUserList";

const TAB_ITEMS = [
  { key: "following", label: "フォロー中" },
  { key: "followers", label: "フォロワー" },
] as const;

// クエリのtypeを followers / following に正規化する
function resolveFollowType(raw: string | null): FollowListType {
  return raw === "followers" ? "followers" : "following";
}

// プロフィール取得とタブ／リスト表示
function FollowsPageContent() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = typeof params.userId === "string" ? params.userId : undefined;
  const activeType = resolveFollowType(searchParams.get("type"));

  const {
    profile,
    isLoading: isProfileLoading,
    isNotFound: isProfileNotFound,
    error: profileError,
    mutate: mutateProfile,
  } = useUserProfile(userId);

  if (!userId) {
    return <NotFoundState />;
  }

  if (isProfileLoading) {
    return <LoadingState variant="page" />;
  }

  if (isProfileNotFound) {
    return <NotFoundState />;
  }

  if (profileError || !profile) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            profileError instanceof ApiClientError
              ? profileError.message
              : "エラーが発生しました。時間をおいて再度お試しください。"
          }
          onRetry={() => void mutateProfile()}
        />
      </div>
    );
  }

  // タブ切替時にURLのtypeを書き換える
  const handleTabChange = (key: string) => {
    router.replace(`/users/${userId}/follows?type=${key}`, { scroll: false });
  };

  // 自分のプロフィールならフォロー数を再取得する
  const handleFollowChange = (
    _targetUserId: string,
    _result: FollowUserResponse,
  ) => {
    if (profile.isSelf) {
      void mutateProfile();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <Link
        href={`/users/${userId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-accent-fg hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {profile.user.name}
      </Link>

      <Tabs
        items={[...TAB_ITEMS]}
        activeKey={activeType}
        onChange={handleTabChange}
      />

      <FollowUserList
        userId={userId}
        type={activeType}
        onFollowChange={handleFollowChange}
      />
    </div>
  );
}

// useSearchParams用にSuspenseを設定してexport する
export default function FollowsPage() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <FollowsPageContent />
    </Suspense>
  );
}
