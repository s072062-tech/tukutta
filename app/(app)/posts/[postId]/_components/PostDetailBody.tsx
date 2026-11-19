// 投稿詳細の本体（戻る・作成者・進捗・本文・お気に入り・スタンプ）コンポーネント
"use client";

import type { FavoriteResponse } from "@/app/api/posts/[postId]/favorite/route";
import type { PostDetail } from "@/app/api/posts/[postId]/route";
import { Avatar } from "@/app/_components/common/Avatar";
import { buttonClassName } from "@/app/_components/common/Button";
import { FavoriteButton } from "@/app/_components/common/FavoriteButton";
import { HashtagText } from "@/app/_components/common/HashtagText";
import { StampBar } from "@/app/_components/common/StampBar";
import { StatusBadge } from "@/app/_components/common/StatusBadge";
import { UserNameLink } from "@/app/_components/common/UserNameLink";
import { formatLongDateTime } from "@/lib/format";
import { Folder, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PostDetailBodyProps = {
  post: PostDetail;
  onFavoriteChange: (result: FavoriteResponse) => void;
  onSendStamp: (emoji: string) => Promise<void>;
  stampDisabled?: boolean;
  stampError?: string | null;
};

// アプリ内からの遷移か確認
function isSameOriginReferrer() {
  if (typeof document === "undefined" || !document.referrer) {
    return false;
  }
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === window.location.origin;
  } catch {
    return false;
  }
}

// 受け取った投稿データを詳細UIとして描画
export function PostDetailBody({
  post,
  onFavoriteChange,
  onSendStamp,
  stampDisabled = false,
  stampError = null,
}: PostDetailBodyProps) {
  const router = useRouter();

  // アプリ内からの遷移なら戻るボタン、遷移元がなければホームへ飛ばす
  const handleBack = () => {
    if (isSameOriginReferrer()) {
      router.back();
      return;
    }
    router.push("/home");
  };

  return (
    <section className="space-y-5">
      <button
        type="button"
        onClick={handleBack}
        className="text-sm font-medium text-[#0F6E6B] hover:underline"
      >
        ← 戻る
      </button>

      <div className="rounded-2xl border border-[#DEE7E9] bg-white p-5">
        <div className="flex items-start gap-3">
          {/* ユーザーアイコン */}
          <Avatar
            name={post.author.name}
            id={post.author.id}
            userId={post.author.userId}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              {/* ユーザー名リンク */}
              <UserNameLink user={post.author} />
              {/* 編集リンク表示確認 */}
              {post.canEdit ? (
                <Link
                  href={`/posts/${post.id}/edit`}
                  className={buttonClassName("secondary", "h-9 shrink-0 px-3")}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  編集
                </Link>
              ) : null}
            </div>

            {/* 進捗ならプロジェクト情報表示 */}
            {post.progress ? (
              <div className="mt-3 space-y-2">
                <Link
                  href={`/projects/${post.progress.project.id}`}
                  className="inline-flex max-w-full items-center gap-1.5 text-sm text-[#0F6E6B] hover:underline"
                >
                  <Folder className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{post.progress.project.name}</span>
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#1C2B2E]">
                  <span className="font-medium">{post.progress.taskName}</span>
                  <StatusBadge status={post.progress.status} />
                </div>
              </div>
            ) : null}

            {/* 本文 */}
            <p className="mt-4 text-base leading-7 text-[#1C2B2E]">
              <HashtagText text={post.body} linkTo="posts" />
            </p>

            {/* 投稿日時 */}
            <time
              className="mt-3 block text-xs text-[#6A7B82]"
              dateTime={post.createdAt}
            >
              {formatLongDateTime(post.createdAt)}
            </time>
          </div>
        </div>

        {/* お気に入りとスタンプ操作 */}
        <div className="mt-5 space-y-3 border-t border-[#DEE7E9] pt-4">
          <FavoriteButton
            postId={post.id}
            isFavorited={post.isFavorited}
            onChange={onFavoriteChange}
          />
          <div>
            <StampBar
              stamps={post.stamps}
              onSend={onSendStamp}
              disabled={stampDisabled}
            />
            {stampError ? (
              <p className="mt-2 text-sm text-[#B42318]">{stampError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
