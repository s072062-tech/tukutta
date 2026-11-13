// プロジェクト詳細取得 API
import type { StampSummary } from "@/types/stamp";
import type { TaskStatus } from "@/types/task";
import type { UserSummary } from "@/types/user";
import { getViewer } from "@/lib/api/auth";
import { notFound, withErrorHandling } from "@/lib/api/errors";
import { toProjectStampSummaries } from "@/lib/api/projectStamp";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";

export type GetProjectResponse = {
  project: { id: number; name: string; description: string | null };
  owner: UserSummary;
  isOwner: boolean;
  isFollowing: boolean;
  stamps: StampSummary[];
  tasks: { id: number; name: string; status: TaskStatus }[];
};

type RouteContext = { params: Promise<{ projectId: string }> };

async function resolveProjectId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  return parsed.data;
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
