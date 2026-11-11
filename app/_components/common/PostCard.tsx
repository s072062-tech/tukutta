// 通常投稿・進捗投稿をカードUIで表示し、クリックで詳細へ遷移する共通コンポーネント
"use client";

import type { FavoriteResponse } from "@/app/api/posts/[postId]/favorite/route";
import { Avatar } from "./Avatar";
import { FavoriteButton } from "./FavoriteButton";
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
      className="cursor-pointer rounded-2xl border border-[#DEE7E9] bg-white p-4 transition-colors hover:border-[#C5D4D8]"
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
            <time className="text-xs text-[#6A7B82]" dateTime={post.createdAt}>
              {formatShortDateTime(post.createdAt)}
            </time>
          </div>

          {post.progress ? (
            <div className="mt-3 space-y-2">
              <Link
                href={`/projects/${post.progress.project.id}`}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex max-w-full items-center gap-1.5 text-sm text-[#0F6E6B] hover:underline"
              >
                <Folder className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{post.progress.project.name}</span>
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#1C2B2E]">
                <span className="font-medium">{post.progress.taskName}</span>
                <StatusBadge status={post.progress.status} />
              </div>
            </div>
          ) : null}

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#1C2B2E]">{post.body}</p>

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
              className="inline-flex items-center gap-1.5 text-sm text-[#6A7B82] hover:text-[#0F6E6B]"
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
