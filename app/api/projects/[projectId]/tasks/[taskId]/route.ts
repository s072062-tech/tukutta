// タスク取得・名前更新・削除 API（登録ユーザーのみ）
import type { TaskStatus } from "@/types/task";
import { requireUser } from "@/lib/api/auth";
import {
  forbidden,
  notFound,
  validationError,
  withErrorHandling,
} from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import {
  updateTaskSchema,
  type UpdateTaskValues,
} from "@/lib/validations/task";
import { ZodError } from "zod";

export type GetTaskResponse = {
  task: { id: number; name: string; status: TaskStatus };
  project: { id: number; name: string };
};

export type UpdateTaskRequest = UpdateTaskValues;
export type UpdateTaskResponse = {
  task: { id: number; name: string; status: TaskStatus };
};

export type DeleteTaskResponse = { ok: true };

type RouteContext = {
  params: Promise<{ projectId: string; taskId: string }>;
};

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function loadOwnedTask(projectIdRaw: string, taskIdRaw: string, userId: number) {
  const projectIdParsed = idParamSchema.safeParse(projectIdRaw);
  const taskIdParsed = idParamSchema.safeParse(taskIdRaw);
  if (!projectIdParsed.success || !taskIdParsed.success) {
    throw notFound();
  }

  const projectId = projectIdParsed.data;
  const taskId = taskIdParsed.data;

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: {
      id: true,
      name: true,
      status: true,
      project: { select: { id: true, name: true, ownerId: true } },
    },
  });
  if (!task) {
    throw notFound();
  }
  if (task.project.ownerId !== userId) {
    throw forbidden();
  }

  return { task, projectId, taskId };
}

// 編集画面用にタスクと所属プロジェクト名を返す
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId, taskId } = await context.params;
  const { task } = await loadOwnedTask(projectId, taskId, user.id);

  const body: GetTaskResponse = {
    task: { id: task.id, name: task.name, status: task.status as TaskStatus },
    project: { id: task.project.id, name: task.project.name },
  };
  return Response.json(body);
});

// タスク名だけを更新する（status は無視）
export const PATCH = withErrorHandling(async (request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId, taskId } = await context.params;
  const { taskId: id } = await loadOwnedTask(projectId, taskId, user.id);

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

  const data = updateTaskSchema.parse(rawBody);
  const updated = await prisma.task.update({
    where: { id },
    data: { name: data.name },
    select: { id: true, name: true, status: true },
  });

  const body: UpdateTaskResponse = {
    task: {
      id: updated.id,
      name: updated.name,
      status: updated.status as TaskStatus,
    },
  };
  return Response.json(body);
});

// タスクを削除し、紐づく進捗投稿は通常投稿として残す
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId, taskId } = await context.params;
  const { taskId: id } = await loadOwnedTask(projectId, taskId, user.id);

  await prisma.$transaction(async (tx) => {
    await tx.post.updateMany({
      where: { taskId: id },
      data: { status: null },
    });
    await tx.task.delete({ where: { id } });
  });

  const body: DeleteTaskResponse = { ok: true };
  return Response.json(body);
});
