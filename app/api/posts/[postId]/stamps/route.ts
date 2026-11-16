// 投稿へのスタンプ送信 API
import type { StampSummary } from "@/types/stamp";
import { Prisma } from "@/app/generated/prisma/client";
import { requireUser } from "@/lib/api/auth";
import { conflict, notFound, withErrorHandling } from "@/lib/api/errors";
import { listPostStampSummaries } from "@/lib/api/postStamp";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";
import { sendStampSchema } from "@/lib/validations/stamp";
import type { z } from "zod";

export type SendPostStampRequest = z.infer<typeof sendStampSchema>;
export type SendPostStampResponse = StampSummary[];

type RouteContext = { params: Promise<{ postId: string }> };

async function resolvePostId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  const post = await prisma.post.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!post) {
    throw notFound();
  }
  return post.id;
}

// 投稿へ絵文字スタンプを1件送る（取り消しなし）
export const POST = withErrorHandling(async (request, context: RouteContext) => {
  const user = await requireUser();
  const { postId: raw } = await context.params;
  const postId = await resolvePostId(raw);
  const { emoji } = sendStampSchema.parse(await request.json());

  try {
    await prisma.postStamp.create({
      data: { userId: user.id, postId, emoji },
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

  const body: SendPostStampResponse = await listPostStampSummaries(postId, user.id);
  return Response.json(body, { status: 201 });
});
