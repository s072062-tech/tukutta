// 指定ユーザーのフォロー中／フォロワー一覧取得 API
import type { Paginated } from "@/types/api";
import type { UserSummary } from "@/types/user";
import { getViewer } from "@/lib/api/auth";
import { withErrorHandling } from "@/lib/api/errors";
import { getUserIdByHandle } from "@/lib/api/user";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  FOLLOW_LIST_TYPES,
  followListQuerySchema,
} from "@/lib/validations/follow";
import type { z } from "zod";

export type FollowListType = (typeof FOLLOW_LIST_TYPES)[number];
export type GetUserFollowsQuery = z.infer<typeof followListQuerySchema>;
export type FollowListItem = UserSummary & {
  isFollowing: boolean;
  isSelf: boolean;
};
export type GetUserFollowsResponse = Paginated<FollowListItem>;

type RouteContext = { params: Promise<{ userId: string }> };

type PersonRow = {
  id: number;
  userId: string;
  name: string;
  followers?: { id: number }[];
};

type FollowRow = {
  id: number;
  person: PersonRow;
};

// DBのユーザー行を一覧用 isFollowing / isSelf に変換
function toFollowListItem(
  person: PersonRow,
  viewerId: number | null,
): FollowListItem {
  const isSelf = viewerId !== null && viewerId === person.id;
  const isFollowing =
    !isSelf && viewerId !== null && (person.followers?.length ?? 0) > 0;
  return {
    id: person.id,
    userId: person.userId,
    name: person.name,
    isFollowing,
    isSelf,
  };
}

// typeとcursorに応じてフォロー／フォロワー一覧を取得
export const GET = withErrorHandling(async (request, context: RouteContext) => {
  const { userId: handle } = await context.params;
  const targetId = await getUserIdByHandle(handle);

  const searchParams = new URL(request.url).searchParams;
  const typeParam = searchParams.get("type") ?? undefined;
  const cursorParam = searchParams.get("cursor") ?? undefined;
  const query = followListQuerySchema.parse({
    ...(typeParam !== undefined ? { type: typeParam } : {}),
    ...(cursorParam !== undefined ? { cursor: cursorParam } : {}),
  });

  const viewer = await getViewer();
  const viewerId = viewer?.id ?? null;
  const personSelect = {
    id: true,
    userId: true,
    name: true,
    followers: viewer
      ? { where: { followerId: viewer.id }, select: { id: true }, take: 1 }
      : false,
  } as const;

  let rows: FollowRow[];

  if (query.type === "followers") {
    const found = await prisma.userFollow.findMany({
      where: { followeeId: targetId },
      select: {
        id: true,
        follower: { select: personSelect },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    rows = found.map((row) => ({ id: row.id, person: row.follower }));
  } else {
    const found = await prisma.userFollow.findMany({
      where: { followerId: targetId },
      select: {
        id: true,
        followee: { select: personSelect },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    rows = found.map((row) => ({ id: row.id, person: row.followee }));
  }

  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const body: GetUserFollowsResponse = {
    items: pageRows.map((row) => toFollowListItem(row.person, viewerId)),
    nextCursor: hasMore ? pageRows[pageRows.length - 1]!.id : null,
  };
  return Response.json(body);
});
