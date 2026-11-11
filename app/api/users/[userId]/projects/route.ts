// ユーザーが登録したプロジェクト一覧 API（全件）
import type { ProjectCard } from "@/types/project";
import { prisma } from "@/lib/prisma";
import { notFound, withErrorHandling } from "@/lib/api/errors";
import { projectCardSelect, toProjectCards } from "@/lib/api/projectCard";
import { userIdParamSchema } from "@/lib/validations/common";

export type GetUserProjectsResponse = ProjectCard[];

type RouteContext = { params: Promise<{ userId: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  const { userId: rawHandle } = await context.params;
  const parsed = userIdParamSchema.safeParse(rawHandle);
  if (!parsed.success) {
    throw notFound();
  }

  const user = await prisma.user.findUnique({
    where: { userId: parsed.data },
    select: {
      id: true,
      projects: {
        select: projectCardSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
    },
  });

  if (!user) {
    throw notFound();
  }

  const body: GetUserProjectsResponse = await toProjectCards(user.projects);
  return Response.json(body);
});
