// 投稿詳細取得 API
import type { StampSummary } from "@/types/stamp";
import type { PostCard } from "@/types/post";
import { getViewer } from "@/lib/api/auth";
import { notFound, withErrorHandling } from "@/lib/api/errors";
import { postCardSelect, toPostCard } from "@/lib/api/postCard";
import { listPostStampSummaries } from "@/lib/api/postStamp";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";

export type PostDetail = PostCard & {
  canEdit: boolean;
  stamps: StampSummary[];
};

export type GetPostResponse = { post: PostDetail };

type RouteContext = { params: Promise<{ postId: string }> };

async function resolvePostId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  return parsed.data;
}

// 1件の投稿詳細（お気に入り・スタンプ集計・編集可否）を返す
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  const { postId: raw } = await context.params;
  const postId = await resolvePostId(raw);
  const viewer = await getViewer();

  const row = await prisma.post.findUnique({
    where: { id: postId },
    select: postCardSelect(viewer?.id ?? null),
  });

  if (!row) {
    throw notFound();
  }

  const stamps = await listPostStampSummaries(postId, viewer?.id ?? null);
  const card = toPostCard(row);
  const body: GetPostResponse = {
    post: {
      ...card,
      canEdit: viewer !== null && viewer.id === row.author.id,
      stamps,
    },
  };
  return Response.json(body);
});
