// 通常投稿・進捗投稿をカードUIで表示し、クリックで詳細へ遷移する共通コンポーネント
"use client";

import type { FavoriteResponse } from "@/app/api/posts/[postId]/favorite/route";
import { Avatar } from "./Avatar";
import { FavoriteButton } from "./FavoriteButton";
import { HashtagText } from "./HashtagText";
import { StatusBadge } from "./StatusBadge";
import { UserNameLink } from "./UserNameLink";
import { formatShortDateTime } from "@/lib/format";
import type { PostCard as PostCardData } from "@/types/post";
import { ChevronRight, Folder, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PostCardProps = {
  post: PostCardData;
  onFavoriteChange?: (postId: number, result: FavoriteResponse) => void;
};

// 投稿1件の投稿ユーザー・本文・進捗・お気に入り・コメント数を表示
export function PostCard({ post, onFavoriteChange }: PostCardProps) {
  const router = useRouter();

  return (
    <article
      className="cursor-pointer rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
      onClick={() => router.push(`/posts/${post.id}`)}
    >
      <div className="flex items-start gap-3">
        <div onClick={(event) => event.stopPropagation()}>
          <Avatar
            name={post.author.name}
            id={post.author.id}
            userId={post.author.userId}
            size="md"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <div onClick={(event) => event.stopPropagation()}>
              <UserNameLink user={post.author} />
            </div>
            <time className="text-xs text-fg-muted" dateTime={post.createdAt}>
              {formatShortDateTime(post.createdAt)}
            </time>
          </div>

          {post.progress ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg bg-surface-muted px-3 py-2">
              <Link
                href={`/projects/${post.progress.project.id}`}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex max-w-full items-center gap-1 text-xs text-accent-fg hover:underline"
              >
                <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{post.progress.project.name}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
              <span className="truncate text-xs text-accent-fg">
                {post.progress.taskName}
              </span>
              <StatusBadge status={post.progress.status} />
            </div>
          ) : null}

          <p className="mt-3 text-sm leading-6 text-fg">
            <HashtagText text={post.body} linkTo="posts" />
          </p>

          <div className="mt-4 flex items-center gap-5">
            <div onClick={(event) => event.stopPropagation()}>
              <FavoriteButton
                postId={post.id}
                isFavorited={post.isFavorited}
                onChange={(result) => onFavoriteChange?.(post.id, result)}
              />
            </div>
            <Link
              href={`/posts/${post.id}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-accent-fg"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {post.commentCount > 0 ? `コメント ${post.commentCount}` : "コメント"}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
