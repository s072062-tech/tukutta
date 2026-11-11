// 投稿のお気に入り追加・解除 API
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { notFound, withErrorHandling } from "@/lib/api/errors";
import { idParamSchema } from "@/lib/validations/common";

export type FavoriteResponse = { isFavorited: boolean; favoriteCount: number };

type RouteContext = { params: Promise<{ postId: string }> };

// パスのpostIdを検証し、存在する投稿のIDを返す（なければ404）
async function resolvePostId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  const post = await prisma.post.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!post) {
    throw notFound();
  }
  return post.id;
}

// 投稿をお気に入りに追加
export const POST = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { postId: rawPostId } = await context.params;
  const postId = await resolvePostId(rawPostId);

  await prisma.postFavorite.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    create: { userId: user.id, postId },
    update: {},
  });

  const favoriteCount = await prisma.postFavorite.count({ where: { postId } });
  const body: FavoriteResponse = { isFavorited: true, favoriteCount };
  return Response.json(body);
});

// 投稿のお気に入りを解除
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { postId: rawPostId } = await context.params;
  const postId = await resolvePostId(rawPostId);

  await prisma.postFavorite.deleteMany({
    where: { userId: user.id, postId },
  });

  const favoriteCount = await prisma.postFavorite.count({ where: { postId } });
  const body: FavoriteResponse = { isFavorited: false, favoriteCount };
  return Response.json(body);
});
