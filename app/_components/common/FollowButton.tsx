// ユーザーのフォローボタン（楽観的更新）コンポーネント
"use client";

import type { FollowUserResponse } from "@/app/api/users/[userId]/follow/route";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { Button } from "./Button";
import { apiDelete, apiPost } from "@/lib/apiClient";
import { UserPlus, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

type FollowButtonProps = {
  userId: string;
  isFollowing: boolean;
  onChange?: (result: FollowUserResponse) => void;
};

// フォロー状態を表示し、クリックでAPIを呼び出して更新
export function FollowButton({ userId, isFollowing, onChange }: FollowButtonProps) {
  const { ensureLoggedIn } = useLoginGuard();
  const [following, setFollowing] = useState(isFollowing);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // ログイン確認のあと先にUIを切り替え、API成功／失敗で確定または巻き戻す
  const handleClick = async () => {
    if (!ensureLoggedIn() || isSubmitting) {
      return;
    }

    const previous = following;
    const next = !previous;
    setFollowing(next);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = next
        ? await apiPost<FollowUserResponse>(`/api/users/${encodeURIComponent(userId)}/follow`)
        : await apiDelete<FollowUserResponse>(`/api/users/${encodeURIComponent(userId)}/follow`);
      setFollowing(result.isFollowing);
      onChange?.(result);
    } catch {
      setFollowing(previous);
      setErrorMessage("フォローを更新できませんでした。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant={following ? "secondary" : "primary"}
        isLoading={isSubmitting}
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
