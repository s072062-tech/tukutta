// プロジェクトカード用のPrisma selectと、カード表示用のProjectCardへ整形する共通処理
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProjectCard } from "@/types/project";
import type { TaskStatus } from "@/types/task";

// プロジェクトカードに必要な情報を取得するselect定義
export const projectCardSelect = {
  id: true,
  name: true,
  description: true,
  owner: { select: { id: true, userId: true, name: true } },
} satisfies Prisma.ProjectSelect;

export type ProjectCardRow = Prisma.ProjectGetPayload<{
  select: typeof projectCardSelect;
}>;

const EMPTY_COUNTS = {
  total: 0,
  未着手: 0,
  進行中: 0,
  完了: 0,
} as const;

// ProjectCardRowをProjectCardに変換
export async function toProjectCards(rows: ProjectCardRow[]): Promise<ProjectCard[]> {
  if (rows.length === 0) {
    return [];
  }

  const grouped = await prisma.task.groupBy({
    by: ["projectId", "status"],
    where: { projectId: { in: rows.map((row) => row.id) } },
    _count: { _all: true },
  });

  const countsByProject = new Map<number, { total: number; 未着手: number; 進行中: number; 完了: number }>();
  for (const row of rows) {
    countsByProject.set(row.id, { ...EMPTY_COUNTS });
  }

  for (const group of grouped) {
    const counts = countsByProject.get(group.projectId);
    if (!counts) {
      continue;
    }
    const status = group.status as TaskStatus;
    counts[status] = group._count._all;
    counts.total += group._count._all;
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    owner: row.owner,
    taskCounts: countsByProject.get(row.id) ?? { ...EMPTY_COUNTS },
  }));
}
