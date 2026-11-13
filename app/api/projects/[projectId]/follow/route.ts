// プロジェクトのフォロー追加・解除 API
import { requireUser } from "@/lib/api/auth";
import { ApiError, notFound, withErrorHandling } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";

export type FollowProjectResponse = { isFollowing: boolean };

type RouteContext = { params: Promise<{ projectId: string }> };

async function resolveOwnedProject(raw: string, userId: number) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  const project = await prisma.project.findUnique({
    where: { id: parsed.data },
    select: { id: true, ownerId: true },
  });
  if (!project) {
    throw notFound();
  }
  if (project.ownerId === userId) {
    throw new ApiError(422, "VALIDATION_ERROR", "自分のプロジェクトはフォローできません。");
  }
  return project.id;
}

// プロジェクトをフォローする
export const POST = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId: raw } = await context.params;
  const projectId = await resolveOwnedProject(raw, user.id);

  await prisma.projectFollow.upsert({
    where: { userId_projectId: { userId: user.id, projectId } },
    create: { userId: user.id, projectId },
    update: {},
  });

  const body: FollowProjectResponse = { isFollowing: true };
  return Response.json(body);
});

// プロジェクトのフォローを外す
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId: raw } = await context.params;
  const projectId = await resolveOwnedProject(raw, user.id);

  await prisma.projectFollow.deleteMany({
    where: { userId: user.id, projectId },
  });

  const body: FollowProjectResponse = { isFollowing: false };
  return Response.json(body);
});
