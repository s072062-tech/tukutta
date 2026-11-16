// コメントのお気に入りボタン（動作は FavoriteButton と同じ）
"use client";

import type { CommentFavoriteResponse } from "@/app/api/comments/[commentId]/favorite/route";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { apiDelete, apiPost } from "@/lib/apiClient";
import { clsx } from "clsx";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

type CommentFavoriteButtonProps = {
  commentId: number;
  isFavorited: boolean;
  onChange?: (result: CommentFavoriteResponse) => void;
};

export function CommentFavoriteButton({
  commentId,
  isFavorited,
  onChange,
}: CommentFavoriteButtonProps) {
  const { ensureLoggedIn } = useLoginGuard();
  const [favorited, setFavorited] = useState(isFavorited);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    const timer = window.setTimeout(() => setErrorMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const handleClick = async () => {
    if (!ensureLoggedIn() || isSubmitting) {
      return;
    }

    const previous = favorited;
    const next = !previous;
    setFavorited(next);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = next
        ? await apiPost<CommentFavoriteResponse>(
            `/api/comments/${commentId}/favorite`,
          )
        : await apiDelete<CommentFavoriteResponse>(
            `/api/comments/${commentId}/favorite`,
          );
      setFavorited(result.isFavorited);
      onChange?.(result);
    } catch {
      setFavorited(previous);
      setErrorMessage("お気に入りを更新できませんでした。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleClick();
        }}
        className={clsx(
          "inline-flex items-center gap-1.5 text-xs disabled:opacity-60",
          favorited ? "text-[#0F6E6B]" : "text-[#6A7B82] hover:text-[#0F6E6B]",
        )}
      >
        <Heart
          className="h-3.5 w-3.5"
          fill={favorited ? "currentColor" : "none"}
          aria-hidden
        />
        お気に入り
      </button>
      {errorMessage ? (
        <p className="absolute left-0 top-full mt-1 whitespace-nowrap text-xs text-[#B42318]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
