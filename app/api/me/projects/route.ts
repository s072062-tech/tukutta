// 自分のプロジェクトとタスク一覧（進捗投稿フォーム用）
import type { TaskStatus } from "@/types/task";
import { requireUser } from "@/lib/api/auth";
import { withErrorHandling } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export type MyTaskOption = { id: number; name: string; status: TaskStatus };
export type MyProjectOption = {
  id: number;
  name: string;
  tasks: MyTaskOption[];
};
export type GetMyProjectsResponse = { projects: MyProjectOption[] };

// 自分がownerのプロジェクトだけを返す
export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      tasks: {
        select: { id: true, name: true, status: true },
        orderBy: { name: "asc" },
      },
    },
  });

  const body: GetMyProjectsResponse = { projects };
  return Response.json(body);
});
