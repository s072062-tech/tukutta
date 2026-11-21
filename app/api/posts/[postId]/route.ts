// 投稿詳細取得・更新・削除 API
import type { StampSummary } from "@/types/stamp";
import type { PostCard } from "@/types/post";
import { getViewer, requireUser } from "@/lib/api/auth";
import {
  ApiError,
  forbidden,
  notFound,
  validationError,
  withErrorHandling,
} from "@/lib/api/errors";
import { postCardSelect, toPostCard } from "@/lib/api/postCard";
import { listPostStampSummaries } from "@/lib/api/postStamp";
import { syncPostHashtags } from "@/lib/hashtag";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import {
  updatePostSchema,
  type UpdatePostValues,
} from "@/lib/validations/post";
import { ZodError } from "zod";

export type PostDetail = PostCard & {
  canEdit: boolean;
  stamps: StampSummary[];
};

export type GetPostResponse = { post: PostDetail };

export type UpdatePostRequest = UpdatePostValues;
export type UpdatePostResponse = { post: PostCard };

export type DeletePostResponse = { id: number };

type RouteContext = { params: Promise<{ postId: string }> };

async function resolvePostId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  return parsed.data;
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
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

// 投稿ユーザーが本文（進捗ならタスクも）を更新する
export const PATCH = withErrorHandling(async (request, context: RouteContext) => {
  const user = await requireUser();
  const { postId: raw } = await context.params;
  const postId = await resolvePostId(raw);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, taskId: true, status: true },
  });
  if (!post) {
    throw notFound();
  }
  if (post.authorId !== user.id) {
    throw forbidden();
  }

  const rawBody = await readJson(request);
  if (rawBody === null) {
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

  const input = updatePostSchema.parse(rawBody);

  // 通常投稿を進捗へ変える操作を拒む
  if (post.taskId === null) {
    if (
      typeof input.projectId === "number" ||
      typeof input.taskId === "number" ||
      input.status === "未着手" ||
      input.status === "進行中" ||
      input.status === "完了"
    ) {
      const message = "通常投稿を進捗投稿には変えられません。";
      throw new ApiError(422, "VALIDATION_ERROR", message, {
        taskId: [message],
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { body: input.body },
      });
      await syncPostHashtags(tx, postId, input.body);
    });
  } else {
    // 進捗投稿から通常へ戻す操作を拒む
    if (input.taskId === null || input.status === null) {
      const message = "進捗投稿を通常投稿には変えられません。";
      throw new ApiError(422, "VALIDATION_ERROR", message, {
        taskId: [message],
      });
    }

    const nextTaskId = input.taskId ?? post.taskId;
    const nextStatus = input.status ?? post.status;
    if (nextStatus === null) {
      const message = "進捗投稿を通常投稿には変えられません。";
      throw new ApiError(422, "VALIDATION_ERROR", message, {
        taskId: [message],
      });
    }

    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: nextTaskId },
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
      if (typeof input.projectId === "number" && task.projectId !== input.projectId) {
        const message =
          "選択したタスクは、選択したプロジェクトのタスクではありません。";
        throw new ApiError(422, "VALIDATION_ERROR", message, {
          taskId: [message],
        });
      }

      await tx.post.update({
        where: { id: postId },
        data: { body: input.body, taskId: nextTaskId, status: nextStatus },
      });
      await syncPostHashtags(tx, postId, input.body);

      if (task.status !== nextStatus) {
        await tx.task.update({
          where: { id: task.id },
          data: { status: nextStatus },
        });
      }
    });
  }

  const row = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: postCardSelect(user.id),
  });
  const body: UpdatePostResponse = { post: toPostCard(row) };
  return Response.json(body);
});

// 投稿ユーザーが投稿を削除する（関連行は CASCADE）
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { postId: raw } = await context.params;
  const postId = await resolvePostId(raw);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) {
    throw notFound();
  }
  if (post.authorId !== user.id) {
    throw forbidden();
  }

  await prisma.post.delete({ where: { id: postId } });
  const body: DeletePostResponse = { id: postId };
  return Response.json(body);
});
