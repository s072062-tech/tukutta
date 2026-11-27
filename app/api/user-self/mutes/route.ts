// ログイン中ユーザーのミュート一覧 API
import { requireUser } from "@/lib/api/auth";
import { withErrorHandling } from "@/lib/api/errors";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cursorQuerySchema } from "@/lib/validations/common";
import type { Paginated } from "@/types/api";
import type { UserSummary } from "@/types/user";

export type MutedListItem = UserSummary;
export type GetMutedUsersResponse = Paginated<MutedListItem>;

export const GET = withErrorHandling(async (request) => {
  const user = await requireUser();

  const cursorParam = new URL(request.url).searchParams.get("cursor") ?? undefined;
  const cursor =
    cursorParam !== undefined ? cursorQuerySchema.parse(cursorParam) : undefined;

  const rows = await prisma.mute.findMany({
    where: { muterId: user.id },
    select: {
      id: true,
      mutedUser: { select: { id: true, userId: true, name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor !== undefined ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const items: MutedListItem[] = pageRows.map((row) => ({
    id: row.mutedUser.id,
    userId: row.mutedUser.userId,
    name: row.mutedUser.name,
  }));
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]!.id : null;

  const body: GetMutedUsersResponse = { items, nextCursor };
  return Response.json(body);
});
