// コメントのお気に入り追加・解除 API
import { requireUser } from "@/lib/api/auth";
import { notFound, withErrorHandling } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";

export type CommentFavoriteResponse = {
  isFavorited: boolean;
  favoriteCount: number;
};

type RouteContext = { params: Promise<{ commentId: string }> };

async function resolveCommentId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  const comment = await prisma.postComment.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!comment) {
    throw notFound();
  }
  return comment.id;
}

// コメントをお気に入りに追加（二重押しでも 409 にしない）
export const POST = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { commentId: raw } = await context.params;
  const commentId = await resolveCommentId(raw);

  await prisma.postCommentFavorite.upsert({
    where: { userId_commentId: { userId: user.id, commentId } },
    create: { userId: user.id, commentId },
    update: {},
  });

  const favoriteCount = await prisma.postCommentFavorite.count({
    where: { commentId },
  });
  const body: CommentFavoriteResponse = { isFavorited: true, favoriteCount };
  return Response.json(body);
});

// コメントのお気に入りを解除（行が無くても 200）
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { commentId: raw } = await context.params;
  const commentId = await resolveCommentId(raw);

  await prisma.postCommentFavorite.deleteMany({
    where: { userId: user.id, commentId },
  });

  const favoriteCount = await prisma.postCommentFavorite.count({
    where: { commentId },
  });
  const body: CommentFavoriteResponse = { isFavorited: false, favoriteCount };
  return Response.json(body);
});
