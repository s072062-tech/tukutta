// プロジェクトの歩み（月次カレンダー）取得 API
import { notFound, withErrorHandling } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import { journeyQuerySchema } from "@/lib/validations/project";

export type JourneyPostChip = {
  postId: number;
  taskName: string;
  time: string;
};

export type GetProjectJourneyResponse = {
  year: number;
  month: number;
  days: { date: string; posts: JourneyPostChip[] }[];
};

type RouteContext = { params: Promise<{ projectId: string }> };

const tokyoDateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
});

// 日時をAsia/Tokyoとして、年と月を取り出す
function resolveTokyoYearMonth(date = new Date()) {
  const parts = tokyoDateParts.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month };
}

// 日時を YYYY-MM-DD（東京時間）に変換する
function tokyoDayKey(date: Date) {
  const parts = tokyoDateParts.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = (parts.find((part) => part.type === "month")?.value ?? "0").padStart(
    2,
    "0",
  );
  const day = (parts.find((part) => part.type === "day")?.value ?? "0").padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 日時を H:MM（東京時間）のラベルにする
function tokyoTimeLabel(date: Date) {
  const parts = tokyoDateParts.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

// 指定年月の東京時間での開始〜翌月開始の範囲を返す
function monthRangeTokyo(year: number, month: number) {
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`);
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = new Date(
    `${endYear}-${String(endMonth).padStart(2, "0")}-01T00:00:00+09:00`,
  );
  return { start, end };
}

// 指定月（省略時は Asia/Tokyo の当月）の進捗投稿を日ごとに返す
export const GET = withErrorHandling(async (request, context: RouteContext) => {
  const { projectId: raw } = await context.params;
  const parsedId = idParamSchema.safeParse(raw);
  if (!parsedId.success) {
    throw notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: parsedId.data },
    select: { id: true },
  });
  if (!project) {
    throw notFound();
  }

  const query = journeyQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  const current = resolveTokyoYearMonth();
  const year = query.year ?? current.year;
  const month = query.month ?? current.month;
  const { start, end } = monthRangeTokyo(year, month);

  const rows = await prisma.post.findMany({
    where: {
      taskId: { not: null },
      task: { projectId: project.id },
      createdAt: { gte: start, lt: end },
    },
    select: {
      id: true,
      createdAt: true,
      task: { select: { name: true } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const byDate = new Map<string, JourneyPostChip[]>();
  for (const row of rows) {
    if (!row.task) {
      continue;
    }
    const date = tokyoDayKey(row.createdAt);
    const list = byDate.get(date) ?? [];
    list.push({
      postId: row.id,
      taskName: row.task.name,
      time: tokyoTimeLabel(row.createdAt),
    });
    byDate.set(date, list);
  }

  const days = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, posts]) => ({ date, posts }));

  const body: GetProjectJourneyResponse = { year, month, days };
  return Response.json(body);
});
