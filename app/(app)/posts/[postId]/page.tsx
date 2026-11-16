// 投稿詳細（/posts/{postId}）
"use client";

import type { FavoriteResponse } from "@/app/api/posts/[postId]/favorite/route";
import type { GetPostResponse } from "@/app/api/posts/[postId]/route";
import type { SendPostStampResponse } from "@/app/api/posts/[postId]/stamps/route";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { ApiClientError, apiPost } from "@/lib/apiClient";
import type { StampSummary } from "@/types/stamp";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CommentThread } from "./_components/CommentThread";
import { PostDetailBody } from "./_components/PostDetailBody";
import { useComments } from "./_hooks/useComments";
import { usePostDetail } from "./_hooks/usePostDetail";

// URLのpostIdを正の整数に変換
function parsePostId(raw: string | undefined) {
  if (raw == null || raw === "") {
    return null;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

// スタンプを件数降順、同数なら絵文字順に並べる
function sortStamps(stamps: StampSummary[]) {
  return [...stamps].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.emoji.localeCompare(b.emoji);
  });
}

// 送信前にローカルのスタンプ一覧へ件数を仮反映する
function applyOptimisticStamp(stamps: StampSummary[], emoji: string) {
  const existing = stamps.find((stamp) => stamp.emoji === emoji);
  if (existing) {
    return sortStamps(
      stamps.map((stamp) =>
        stamp.emoji === emoji
          ? { ...stamp, count: stamp.count + 1, sentByMe: true }
          : stamp,
      ),
    );
  }
  return sortStamps([...stamps, { emoji, count: 1, sentByMe: true }]);
}

// 投稿詳細画面全体の状態管理と描画
export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const rawPostId = typeof params.postId === "string" ? params.postId : undefined;
  const postId = parsePostId(rawPostId);
  const { ensureLoggedIn } = useLoginGuard();

  const {
    post,
    isLoading: postLoading,
    isNotFound,
    error: postError,
    mutate: mutatePost,
  } = usePostDetail(postId);

  const {
    comments,
    isLoading: commentsLoading,
    error: commentsError,
    mutate: mutateComments,
  } = useComments(postId, { enabled: postId != null && !isNotFound && post != null });

  const [sendingEmoji, setSendingEmoji] = useState<string | null>(null);
  const [stampError, setStampError] = useState<string | null>(null);

  useEffect(() => {
    if (!stampError) {
      return;
    }
    const timer = window.setTimeout(() => setStampError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [stampError]);

  if (postId == null) {
    return <NotFoundState />;
  }

  if (postLoading) {
    return <LoadingState variant="page" />;
  }

  if (isNotFound) {
    return <NotFoundState />;
  }

  if (postError || !post) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            postError instanceof ApiClientError && postError.message
              ? postError.message
              : "投稿を読み込めませんでした。"
          }
          onRetry={() => void mutatePost()}
        />
      </div>
    );
  }

  // お気に入り結果を投稿キャッシュに即時反映する
  const handleFavoriteChange = (result: FavoriteResponse) => {
    void mutatePost(
      (current): GetPostResponse | undefined =>
        current
          ? {
              post: {
                ...current.post,
                isFavorited: result.isFavorited,
                favoriteCount: result.favoriteCount,
              },
            }
          : current,
      { revalidate: false },
    );
  };

  // ログイン確認後、楽観更新でスタンプをAPI送信する
  const handleSendStamp = async (emoji: string) => {
    if (!ensureLoggedIn()) {
      return;
    }
    setStampError(null);
    setSendingEmoji(emoji);
    const previous = post.stamps;
    const optimistic = applyOptimisticStamp(previous, emoji);
    void mutatePost(
      (current): GetPostResponse | undefined =>
        current ? { post: { ...current.post, stamps: optimistic } } : current,
      { revalidate: false },
    );

    try {
      const stamps = await apiPost<SendPostStampResponse>(
        `/api/posts/${postId}/stamps`,
        { emoji },
      );
      void mutatePost(
        (current): GetPostResponse | undefined =>
          current ? { post: { ...current.post, stamps } } : current,
        { revalidate: false },
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setStampError(error.message || "このスタンプは送信済みです。");
        void mutatePost();
      } else {
        void mutatePost(
          (current): GetPostResponse | undefined =>
            current ? { post: { ...current.post, stamps: previous } } : current,
          { revalidate: false },
        );
        setStampError(
          error instanceof ApiClientError
            ? error.message
            : "スタンプを送信できませんでした。",
        );
      }
    } finally {
      setSendingEmoji(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8">
      <PostDetailBody
        post={post}
        onFavoriteChange={handleFavoriteChange}
        onSendStamp={handleSendStamp}
        stampDisabled={sendingEmoji !== null}
        stampError={stampError}
      />
      <CommentThread
        postId={postId}
        comments={comments}
        isLoading={commentsLoading}
        error={commentsError}
        mutate={mutateComments}
      />
    </div>
  );
}
