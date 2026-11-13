// プロジェクトへのスタンプ送信 API
import type { StampSummary } from "@/types/stamp";
import { Prisma } from "@/app/generated/prisma/client";
import { requireUser } from "@/lib/api/auth";
import { conflict, notFound, withErrorHandling } from "@/lib/api/errors";
import { toProjectStampSummaries } from "@/lib/api/projectStamp";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import { sendStampSchema } from "@/lib/validations/stamp";
import type { z } from "zod";

export type SendProjectStampRequest = z.infer<typeof sendStampSchema>;
export type SendProjectStampResponse = StampSummary[];

type RouteContext = { params: Promise<{ projectId: string }> };

async function resolveProjectId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  const project = await prisma.project.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!project) {
    throw notFound();
  }
  return project.id;
}

// プロジェクトへ絵文字スタンプを送る
export const POST = withErrorHandling(async (request, context: RouteContext) => {
  const user = await requireUser();
  const { projectId: raw } = await context.params;
  const projectId = await resolveProjectId(raw);
  const { emoji } = sendStampSchema.parse(await request.json());

  try {
    await prisma.projectStamp.create({
      data: { userId: user.id, projectId, emoji },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("このスタンプは送信済みです。");
    }
    throw error;
  }

  const body: SendProjectStampResponse = await toProjectStampSummaries(
    projectId,
    user.id,
  );
  return Response.json(body);
});
