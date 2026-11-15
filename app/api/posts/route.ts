// 投稿一覧取得と新規作成 API
import type { Prisma } from "@/app/generated/prisma/client";
import type { Paginated } from "@/types/api";
import type { PostCard } from "@/types/post";
import { getViewer, requireUser } from "@/lib/api/auth";
import {
  ApiError,
  notFound,
  validationError,
  withErrorHandling,
} from "@/lib/api/errors";
import { excludeMutedAuthors } from "@/lib/api/mute";
import { postCardSelect, toPostCard } from "@/lib/api/postCard";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  createPostSchema,
  postListQuerySchema,
  type CreatePostValues,
  type PostListQuery,
} from "@/lib/validations/post";
import { ZodError } from "zod";

export type GetPostsQuery = PostListQuery;
export type GetPostsResponse = Paginated<PostCard>;

export type CreatePostRequest = CreatePostValues;
export type CreatePostResponse = { post: PostCard };

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 新着／フォロー／進捗タブと本文検索の投稿一覧
export const GET = withErrorHandling(async (request: Request) => {
  const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
  const { tab, q, cursor } = postListQuerySchema.parse(raw);

  const viewer =
    tab === "following" ? await requireUser() : await getViewer();
  const viewerId = viewer?.id ?? null;

  const andConditions: Prisma.PostWhereInput[] = [excludeMutedAuthors(viewerId)];

  if (q) {
    andConditions.push({ body: { contains: q, mode: "insensitive" } });
  }

  if (tab === "progress") {
    andConditions.push({ taskId: { not: null } });
  }

  if (tab === "following") {
    const followees = await prisma.userFollow.findMany({
      where: { followerId: viewer!.id },
      select: { followeeId: true },
    });
    const followeeIds = followees.map((row) => row.followeeId);
    if (followeeIds.length === 0) {
      const empty: GetPostsResponse = { items: [], nextCursor: null };
      return Response.json(empty);
    }
    andConditions.push({ authorId: { in: followeeIds } });
  }

  const rows = await prisma.post.findMany({
    where: { AND: andConditions },
    select: postCardSelect(viewerId),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const body: GetPostsResponse = {
    items: pageRows.map(toPostCard),
    nextCursor: hasMore ? pageRows[pageRows.length - 1]!.id : null,
  };
  return Response.json(body);
});

// 通常投稿または進捗投稿を作成する
export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const raw = await readJson(request);
  if (raw === null) {
    throw validationError(
      new ZodError([
        {
          code: "custom",
          path: [],
          message: "入力内容を確認してください。",
        },
      ]),
    );
  }

  const input = createPostSchema.parse(raw);

  let createdId: number;

  if (input.kind === "normal") {
    const created = await prisma.post.create({
      data: {
        authorId: user.id,
        body: input.body,
        taskId: null,
        status: null,
      },
      select: { id: true },
    });
    createdId = created.id;
  } else {
    createdId = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: input.taskId },
        select: {
          id: true,
          status: true,
          projectId: true,
          project: { select: { ownerId: true } },
        },
      });
      if (!task) {
        throw notFound();
      }
      if (task.project.ownerId !== user.id) {
        throw new ApiError(
          403,
          "FORBIDDEN",
          "自分が登録したプロジェクトのタスクを選んでください。",
        );
      }
      if (task.projectId !== input.projectId) {
        const message =
          "選択したタスクは、選択したプロジェクトのタスクではありません。";
        throw new ApiError(422, "VALIDATION_ERROR", message, {
          taskId: [message],
        });
      }

      const created = await tx.post.create({
        data: {
          authorId: user.id,
          body: input.body,
          taskId: input.taskId,
          status: input.status,
        },
        select: { id: true },
      });

      if (task.status !== input.status) {
        await tx.task.update({
          where: { id: task.id },
          data: { status: input.status },
        });
      }

      return created.id;
    });
  }

  const row = await prisma.post.findUniqueOrThrow({
    where: { id: createdId },
    select: postCardSelect(user.id),
  });
  const body: CreatePostResponse = { post: toPostCard(row) };
  return Response.json(body, { status: 201 });
});
