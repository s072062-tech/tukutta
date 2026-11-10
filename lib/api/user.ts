// ハンドル（User.userId）からデータベースIDを取得する
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api/errors";
import { userIdParamSchema } from "@/lib/validations/common";

// ハンドルに対応するデータベースの数値IDを返す
export async function getUserIdByHandle(handle: string): Promise<number> {
  const parsed = userIdParamSchema.safeParse(handle);
  if (!parsed.success) {
    throw notFound();
  }

  const user = await prisma.user.findUnique({
    where: { userId: parsed.data },
    select: { id: true },
  });
  if (!user) {
    throw notFound();
  }
  return user.id;
}
