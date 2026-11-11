// Prisma selectとDB行を投稿カード表示用のPostCardに整形する共通処理
import type { Prisma } from "@/app/generated/prisma/client";
import { excludeMutedCommentAuthors } from "@/lib/api/mute";
import type { PostCard } from "@/types/post";
import type { TaskStatus } from "@/types/task";

// 投稿カードに必要な列だけを取得
export function postCardSelect(viewerId: number | null) {
  return {
    id: true,
    body: true,
    createdAt: true,
    status: true,
    author: { select: { id: true, userId: true, name: true } },
    task: {
      select: {
        id: true,
        name: true,
        project: { select: { id: true, name: true } },
      },
    },
    _count: {
      select: {
        comments: { where: excludeMutedCommentAuthors(viewerId) },
        favorites: true,
      },
    },
    favorites: viewerId
      ? { where: { userId: viewerId }, select: { id: true }, take: 1 }
      : false,
  } satisfies Prisma.PostSelect;
}

export type PostCardRow = Prisma.PostGetPayload<{
  select: ReturnType<typeof postCardSelect>;
}>;

// DBから取った行をPostCard型に変換
export function toPostCard(row: PostCardRow): PostCard {
  const progress =
    row.task && row.status
      ? {
          taskId: row.task.id,
          taskName: row.task.name,
          status: row.status as TaskStatus,
          project: {
            id: row.task.project.id,
            name: row.task.project.name,
          },
        }
      : null;

  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: row.author,
    progress,
    commentCount: row._count.comments,
    favoriteCount: row._count.favorites,
    isFavorited: Array.isArray(row.favorites) ? row.favorites.length > 0 : false,
  };
}
