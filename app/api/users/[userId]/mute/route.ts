// ユーザーのミュート追加・解除 API
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { ApiError, withErrorHandling } from "@/lib/api/errors";
import { getUserIdByHandle } from "@/lib/api/user";

export type MuteUserResponse = { isMuted: boolean };

type RouteContext = { params: Promise<{ userId: string }> };

// ユーザーをミュートする
export const POST = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { userId: handle } = await context.params;
  const mutedUserId = await getUserIdByHandle(handle);

  if (mutedUserId === user.id) {
    throw new ApiError(422, "VALIDATION_ERROR", "自分自身はミュートできません。");
  }

  await prisma.mute.upsert({
    where: {
      muterId_mutedUserId: { muterId: user.id, mutedUserId },
    },
    create: { muterId: user.id, mutedUserId },
    update: {},
  });

  const body: MuteUserResponse = { isMuted: true };
  return Response.json(body);
});

// ユーザーのミュートを解除する
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { userId: handle } = await context.params;
  const mutedUserId = await getUserIdByHandle(handle);

  await prisma.mute.deleteMany({
    where: { muterId: user.id, mutedUserId },
  });

  const body: MuteUserResponse = { isMuted: false };
  return Response.json(body);
});
