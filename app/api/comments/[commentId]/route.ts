// コメント削除 API（返信は DB CASCADE）
import { requireUser } from "@/lib/api/auth";
import { forbidden, notFound, withErrorHandling } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validations/common";

export type DeleteCommentResponse = { id: number };

type RouteContext = { params: Promise<{ commentId: string }> };

async function resolveCommentId(raw: string) {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  return parsed.data;
}

// コメント作者だけが削除できる
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  const user = await requireUser();
  const { commentId: raw } = await context.params;
  const commentId = await resolveCommentId(raw);

  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true },
  });
  if (!comment) {
    throw notFound();
  }
  if (comment.authorId !== user.id) {
    throw forbidden();
  }

  await prisma.postComment.delete({ where: { id: commentId } });
  const body: DeleteCommentResponse = { id: commentId };
  return Response.json(body);
});
