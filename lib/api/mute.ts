// ミュートしたユーザーの投稿・コメントを一覧から除くPrismaのwhere条件を作成する
import type { Prisma } from "@/app/generated/prisma/client";

// ミュートしたユーザーの投稿を除外する PostWhereInput を返す
export function excludeMutedAuthors(viewerId: number | null): Prisma.PostWhereInput {
  if (viewerId === null) {
    return {};
  }
  return {
    author: {
      mutedBy: {
        none: { muterId: viewerId },
      },
    },
  };
}

// ミュートしたユーザーのコメントを除外する PostWhereInput を返す
export function excludeMutedCommentAuthors(
  viewerId: number | null,
): Prisma.PostCommentWhereInput {
  if (viewerId === null) {
    return {};
  }
  return {
    author: {
      mutedBy: {
        none: { muterId: viewerId },
      },
    },
  };
}
