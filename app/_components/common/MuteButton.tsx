// ユーザーのミュートボタンコンポーネント
"use client";

import type { MuteUserResponse } from "@/app/api/users/[userId]/mute/route";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { Button } from "./Button";
import { apiDelete, apiPost } from "@/lib/apiClient";
import { VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

type MuteButtonProps = {
  userId: string;
  isMuted: boolean;
  onChange?: (result: MuteUserResponse) => void;
};

// ミュート状態を表示し、クリックでAPIを呼び出して更新する
export function MuteButton({ userId, isMuted, onChange }: MuteButtonProps) {
  const { ensureLoggedIn } = useLoginGuard();
  const { mutate } = useSWRConfig();
  const [muted, setMuted] = useState(isMuted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    const timer = window.setTimeout(() => setErrorMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  // ログイン確認のあとミュートAPIを呼び、成功時に状態更新と投稿キャッシュの再検証を行う
  const handleClick = async () => {
    if (!ensureLoggedIn() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = muted
        ? await apiDelete<MuteUserResponse>(`/api/users/${encodeURIComponent(userId)}/mute`)
        : await apiPost<MuteUserResponse>(`/api/users/${encodeURIComponent(userId)}/mute`);
      setMuted(result.isMuted);
      onChange?.(result);
      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/posts"),
        undefined,
        { revalidate: true },
      );
    } catch {
      setErrorMessage("ミュートを更新できませんでした。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        isLoading={isSubmitting}
        icon={<VolumeX className="h-4 w-4" />}
        onClick={() => void handleClick()}
      >
        {muted ? "ミュート解除" : "ミュート"}
      </Button>
      {errorMessage ? (
        <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-[#B42318]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
