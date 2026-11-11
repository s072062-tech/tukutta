// ユーザーの投稿一覧取得API
import type { Paginated } from "@/types/api";
import type { PostCard } from "@/types/post";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/api/auth";
import { postCardSelect, toPostCard } from "@/lib/api/postCard";
import { getUserIdByHandle } from "@/lib/api/user";
import { withErrorHandling } from "@/lib/api/errors";
import { cursorQuerySchema } from "@/lib/validations/common";

export type GetUserPostsQuery = { cursor?: number };
export type GetUserPostsResponse = Paginated<PostCard>;

type RouteContext = { params: Promise<{ userId: string }> };

export const GET = withErrorHandling(async (request, context: RouteContext) => {
  const { userId: handle } = await context.params;
  const authorId = await getUserIdByHandle(handle);

  // cursorがある場合は次ページ分の投稿を取得
  const cursorParam = new URL(request.url).searchParams.get("cursor");
  const cursor =
    cursorParam === null ? undefined : cursorQuerySchema.parse(cursorParam);

  const viewer = await getViewer();
  const rows = await prisma.post.findMany({
    where: { authorId },
    select: postCardSelect(viewer?.id ?? null),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const body: GetUserPostsResponse = {
    items: pageRows.map(toPostCard),
    nextCursor: hasMore ? pageRows[pageRows.length - 1]!.id : null,
  };
  return Response.json(body);
});
