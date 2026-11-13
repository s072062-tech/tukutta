// プロジェクトへのタスク登録 API
import type { TaskStatus } from "@/types/task";
import { requireUser } from "@/lib/api/auth";
import { forbidden, notFound, validationError, withErrorHandling } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import { createTaskSchema, type CreateTaskValues } from "@/lib/validations/task";
import { ZodError } from "zod";

export type CreateTaskRequest = CreateTaskValues;
export type CreateTaskResponse = {
  task: { id: number; name: string; status: TaskStatus };
};

type RouteContext = { params: Promise<{ projectId: string }> };

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 登録者だけがタスクを作成する（Post は作らない）
export const POST = withErrorHandling(async (request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId: raw } = await context.params;
  const parsedId = idParamSchema.safeParse(raw);
  if (!parsedId.success) {
    throw notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: parsedId.data },
    select: { id: true, ownerId: true },
  });
  if (!project) {
    throw notFound();
  }
  if (project.ownerId !== user.id) {
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

  const data = createTaskSchema.parse(rawBody);
  const created = await prisma.task.create({
    data: {
      projectId: project.id,
      name: data.name,
      status: data.status,
    },
    select: { id: true, name: true, status: true },
  });

  const body: CreateTaskResponse = { task: created };
  return Response.json(body, { status: 201 });
});
