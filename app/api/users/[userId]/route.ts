// ユーザープロフィール取得 API
import type { UserSummary } from "@/types/user";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/api/auth";
import { notFound, withErrorHandling } from "@/lib/api/errors";
import { userIdParamSchema } from "@/lib/validations/common";

export type GetUserResponse = {
  user: UserSummary;
  followingCount: number;
  followerCount: number;
  isSelf: boolean;
  isFollowing: boolean;
  isMuted: boolean;
};

type RouteContext = { params: Promise<{ userId: string }> };

// ユーザーのプロフィール情報を取得する
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  const { userId: rawHandle } = await context.params;
  const parsed = userIdParamSchema.safeParse(rawHandle);
  if (!parsed.success) {
    throw notFound();
  }
  const handle = parsed.data;
  const viewer = await getViewer();

  const row = await prisma.user.findUnique({
    where: { userId: handle },
    select: {
      id: true,
      userId: true,
      name: true,
      _count: { select: { following: true, followers: true } },
      followers: viewer
        ? { where: { followerId: viewer.id }, select: { id: true }, take: 1 }
        : false,
      mutedBy: viewer
        ? { where: { muterId: viewer.id }, select: { id: true }, take: 1 }
        : false,
    },
  });

  if (!row) {
    throw notFound();
  }

  const isSelf = viewer?.id === row.id;
  const body: GetUserResponse = {
    user: { id: row.id, userId: row.userId, name: row.name },
    followingCount: row._count.following,
    followerCount: row._count.followers,
    isSelf,
    isFollowing:
      !isSelf && Array.isArray(row.followers) ? row.followers.length > 0 : false,
    isMuted: !isSelf && Array.isArray(row.mutedBy) ? row.mutedBy.length > 0 : false,
  };
  return Response.json(body);
});
