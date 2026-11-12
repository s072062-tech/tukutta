// プロジェクト一覧取得と新規登録 API
import type { Paginated } from "@/types/api";
import type { ProjectCard } from "@/types/project";
import type { Prisma } from "@/app/generated/prisma/client";
import { requireUser } from "@/lib/api/auth";
import { projectCardSelect, toProjectCards } from "@/lib/api/projectCard";
import { validationError, withErrorHandling } from "@/lib/api/errors";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  projectFormSchema,
  projectListQuerySchema,
  type ProjectFormValues,
} from "@/lib/validations/project";
import { ZodError } from "zod";

export type CreateProjectRequest = ProjectFormValues;
export type CreateProjectResponse = { project: { id: number } };

export type GetProjectsQuery = {
  tab: "all" | "following";
  q?: string;
  cursor?: number;
};

export type GetProjectsResponse = Paginated<ProjectCard> & {
  total: number;
};

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 全ユーザー／フォロー中のプロジェクト一覧をカーソルで返す
export const GET = withErrorHandling(async (request: Request) => {
  const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
  const { tab, q, cursor } = projectListQuerySchema.parse(raw);

  const user = tab === "following" ? await requireUser() : null;

  const where: Prisma.ProjectWhereInput = {
    ...(tab === "following" && user
      ? { follows: { some: { userId: user.id } } }
      : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: projectCardSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.project.count({ where }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const items = await toProjectCards(pageRows);
  const body: GetProjectsResponse = {
    items,
    nextCursor: hasMore ? pageRows[pageRows.length - 1]!.id : null,
    total,
  };
  return Response.json(body);
});

// userをオーナーとしてプロジェクトを作成
export const POST = withErrorHandling(async (request) => {
  const user = await requireUser();
  const raw = await readJson(request);
  if (raw === null) {
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

  const { name, description } = projectFormSchema.parse(raw);
  const created = await prisma.project.create({
    data: { name, description, ownerId: user.id },
    select: { id: true },
  });

  const body: CreateProjectResponse = { project: { id: created.id } };
  return Response.json(body, { status: 201 });
});
