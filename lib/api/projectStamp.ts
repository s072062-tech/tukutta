// プロジェクトスタンプを StampSummary[] に集計する
import type { StampSummary } from "@/types/stamp";
import { prisma } from "@/lib/prisma";

// 件数1以上の絵文字だけを count 降順・emoji 昇順で返す
export async function toProjectStampSummaries(
  projectId: number,
  viewerId: number | null,
): Promise<StampSummary[]> {
  const [grouped, mine] = await Promise.all([
    prisma.projectStamp.groupBy({
      by: ["emoji"],
      where: { projectId },
      _count: { _all: true },
    }),
    viewerId == null
      ? Promise.resolve([] as { emoji: string }[])
      : prisma.projectStamp.findMany({
          where: { projectId, userId: viewerId },
          select: { emoji: true },
        }),
  ]);

  const sent = new Set(mine.map((row) => row.emoji));
  return grouped
    .map((row) => ({
      emoji: row.emoji,
      count: row._count._all,
      sentByMe: sent.has(row.emoji),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.emoji.localeCompare(b.emoji);
    });
}
