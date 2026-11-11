// ユーザーのフォロー追加・解除 API
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, withErrorHandling } from "@/lib/api/errors";
import { getUserIdByHandle } from "@/lib/api/user";

export type FollowUserResponse = { isFollowing: boolean; followerCount: number };

type RouteContext = { params: Promise<{ userId: string }> };

// ユーザーをフォローする
export const POST = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { userId: handle } = await context.params;
  const followeeId = await getUserIdByHandle(handle);

  if (followeeId === user.id) {
    throw new ApiError(422, "VALIDATION_ERROR", "自分自身はフォローできません。");
  }

  await prisma.userFollow.upsert({
    where: {
      followerId_followeeId: { followerId: user.id, followeeId },
    },
    create: { followerId: user.id, followeeId },
    update: {},
  });

  const followerCount = await prisma.userFollow.count({ where: { followeeId } });
  const body: FollowUserResponse = { isFollowing: true, followerCount };
  return Response.json(body);
});

// ユーザーのフォローを外す
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { userId: handle } = await context.params;
  const followeeId = await getUserIdByHandle(handle);

  await prisma.userFollow.deleteMany({
    where: { followerId: user.id, followeeId },
  });

  const followerCount = await prisma.userFollow.count({ where: { followeeId } });
  const body: FollowUserResponse = { isFollowing: false, followerCount };
  return Response.json(body);
});
