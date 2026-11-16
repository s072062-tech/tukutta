// 投稿コメントのツリー取得と作成 API
import type { CommentNode } from "@/types/comment";
import { getViewer, requireUser } from "@/lib/api/auth";
import { ApiError, notFound, withErrorHandling } from "@/lib/api/errors";
import { toCommentTree } from "@/lib/api/commentTree";
import { excludeMutedCommentAuthors } from "@/lib/api/mute";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import { createCommentSchema } from "@/lib/validations/comment";
import type { z } from "zod";

export type { CommentNode };
export type GetCommentsResponse = { comments: CommentNode[] };
export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
export type CreateCommentResponse = { comment: CommentNode };

type RouteContext = { params: Promise<{ postId: string }> };

const PARENT_MISMATCH_MESSAGE = "返信先がこの投稿のコメントではありません。";

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

// ミュートユーザーを除いたコメントのツリーを返す
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  const { postId: raw } = await context.params;
  const postId = await resolvePostId(raw);
  const viewer = await getViewer();

  const rows = await prisma.postComment.findMany({
    where: {
      postId,
      AND: [excludeMutedCommentAuthors(viewer?.id ?? null)],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      body: true,
      createdAt: true,
      parentCommentId: true,
      author: { select: { id: true, userId: true, name: true } },
      _count: { select: { favorites: true } },
      favorites: viewer
        ? { where: { userId: viewer.id }, select: { id: true }, take: 1 }
        : false,
    },
  });

  const body: GetCommentsResponse = {
    comments: toCommentTree(rows, viewer?.id ?? null),
  };
  return Response.json(body);
});

// ルートコメントまたは返信を作成する
export const POST = withErrorHandling(async (request, context: RouteContext) => {
  const user = await requireUser();
  const { postId: raw } = await context.params;
  const postId = await resolvePostId(raw);
  const input = createCommentSchema.parse(await request.json());

  if (input.parentCommentId != null) {
    const parent = await prisma.postComment.findUnique({
      where: { id: input.parentCommentId },
      select: { id: true, postId: true },
    });
    if (!parent) {
      throw notFound();
    }
    if (parent.postId !== postId) {
      throw new ApiError(422, "VALIDATION_ERROR", PARENT_MISMATCH_MESSAGE, {
        parentCommentId: [PARENT_MISMATCH_MESSAGE],
      });
    }
  }

  const created = await prisma.postComment.create({
    data: {
      postId,
      authorId: user.id,
      body: input.body,
      parentCommentId: input.parentCommentId ?? null,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, userId: true, name: true } },
    },
  });

  const comment: CommentNode = {
    id: created.id,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    author: created.author,
    isFavorited: false,
    favoriteCount: 0,
    canDelete: true,
    replies: [],
  };

  const body: CreateCommentResponse = { comment };
  return Response.json(body, { status: 201 });
});
