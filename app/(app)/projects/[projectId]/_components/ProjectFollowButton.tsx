// プロジェクトのフォロー／解除ボタン（楽観更新）
"use client";

import type { FollowProjectResponse } from "@/app/api/projects/[projectId]/follow/route";
import { Button } from "@/app/_components/common/Button";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { ApiClientError, apiDelete, apiPost } from "@/lib/apiClient";
import { UserCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

type ProjectFollowButtonProps = {
  projectId: number;
  isFollowing: boolean;
  onChange: (result: FollowProjectResponse) => void;
};

// 見た目を先に切り替え、成功で確定・失敗で戻す
export function ProjectFollowButton({
  projectId,
  isFollowing,
  onChange,
}: ProjectFollowButtonProps) {
  const { ensureLoggedIn } = useLoginGuard();
  const { mutate } = useSWRConfig();
  const [following, setFollowing] = useState(isFollowing);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    const timer = window.setTimeout(() => setErrorMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const handleClick = async () => {
    if (!ensureLoggedIn() || isPending) {
      return;
    }

    const previous = following;
    const next = !previous;
    setFollowing(next);
    setIsPending(true);
    setErrorMessage(null);

    try {
      const path = `/api/projects/${projectId}/follow`;
      const result = next
        ? await apiPost<FollowProjectResponse>(path)
        : await apiDelete<FollowProjectResponse>(path);
      setFollowing(result.isFollowing);
      onChange(result);
      void mutate(
        (key) => typeof key === "string" && key.startsWith("/api/projects?"),
        undefined,
        { revalidate: true },
      );
    } catch (error) {
      setFollowing(previous);
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "フォローを更新できませんでした。",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant={following ? "secondary" : "primary"}
        isLoading={isPending}
        icon={following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        onClick={() => void handleClick()}
      >
        {following ? "フォロー中" : "フォロー"}
      </Button>
      {errorMessage ? (
        <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-[#B42318]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
