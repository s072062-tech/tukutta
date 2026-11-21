// プロジェクト詳細取得・更新・削除 API
import type { StampSummary } from "@/types/stamp";
import type { TaskStatus } from "@/types/task";
import type { UserSummary } from "@/types/user";
import { getViewer, requireUser } from "@/lib/api/auth";
import {
  forbidden,
  notFound,
  validationError,
  withErrorHandling,
} from "@/lib/api/errors";
import { toProjectStampSummaries } from "@/lib/api/projectStamp";
import { syncProjectHashtags } from "@/lib/hashtag";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/validations/project";
import { ZodError } from "zod";

export type GetProjectResponse = {
  project: { id: number; name: string; description: string | null };
  owner: UserSummary;
  isOwner: boolean;
  isFollowing: boolean;
  stamps: StampSummary[];
  tasks: { id: number; name: string; status: TaskStatus }[];
};

export type UpdateProjectRequest = ProjectFormValues;
export type UpdateProjectResponse = { id: number };

export type DeleteProjectResponse = { ok: true };

type RouteContext = { params: Promise<{ projectId: string }> };

async function resolveProjectId(raw: string) {
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

// プロジェクト詳細・タスク・スタンプ・フォロー状態を返す
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  const { projectId: raw } = await context.params;
  const projectId = await resolveProjectId(raw);
  const viewer = await getViewer();

  const row = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      owner: { select: { id: true, userId: true, name: true } },
      tasks: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, name: true, status: true },
      },
      follows: viewer
        ? { where: { userId: viewer.id }, select: { id: true }, take: 1 }
        : false,
    },
  });

  if (!row) {
    throw notFound();
  }

  const stamps = await toProjectStampSummaries(projectId, viewer?.id ?? null);
  const follows = Array.isArray(row.follows) ? row.follows : [];
  const body: GetProjectResponse = {
    project: {
      id: row.id,
      name: row.name,
      description: row.description,
    },
    owner: row.owner,
    isOwner: viewer !== null && viewer.id === row.ownerId,
    isFollowing: viewer !== null && follows.length > 0,
    stamps,
    tasks: row.tasks,
  };
  return Response.json(body);
});

// 登録ユーザーが名前と概要を更新する
export const PATCH = withErrorHandling(async (request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId: raw } = await context.params;
  const projectId = await resolveProjectId(raw);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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

  const data = projectFormSchema.parse(rawBody);
  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { name: data.name, description: data.description },
      select: { id: true },
    });
    await syncProjectHashtags(tx, projectId, data.description);
  });

  const body: UpdateProjectResponse = { id: projectId };
  return Response.json(body);
});

// 登録ユーザーがプロジェクトを削除する（進捗投稿は通常投稿として残す）
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId: raw } = await context.params;
  const projectId = await resolveProjectId(raw);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });
  if (!project) {
    throw notFound();
  }
  if (project.ownerId !== user.id) {
    throw forbidden();
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.updateMany({
      where: { task: { projectId } },
      data: { status: null },
    });
    await tx.project.delete({ where: { id: projectId } });
  });

  const body: DeleteProjectResponse = { ok: true };
  return Response.json(body);
});
