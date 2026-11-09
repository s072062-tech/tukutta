// 認証済みユーザーのプロフィール（ユーザー名・ユーザーID）新規作成API
import type { UserSelf } from "@/app/api/user-self/route";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/api/auth";
import { conflict, unauthorized, withErrorHandling } from "@/lib/api/errors";
import { createUserSchema, type CreateUserFormValues } from "@/lib/validations/user";
import { Prisma } from "@/app/generated/prisma/client";

export type CreateUserRequest = CreateUserFormValues;

export type CreateUserResponse = {
  user: UserSelf;
};

// リクエストボディをJSONとして読み、失敗時は null を返す
async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 認証・重複チェック・バリデーション後にユーザー情報をDBへ登録
export const POST = withErrorHandling(async (request) => {
  const { authUser, user } = await getAuthContext();
  if (!authUser) {
    throw unauthorized();
  }
  if (user) {
    throw conflict("プロフィールは登録済みです。");
  }

  const body = await readJson(request);
  const { name, userId } = createUserSchema.parse(body);

  try {
    const created = await prisma.user.create({
      data: { authUserId: authUser.id, userId, name },
      select: { id: true, userId: true, name: true },
    });
    const response: CreateUserResponse = { user: created };
    return Response.json(response, { status: 201 });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }

    const existing = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      select: { id: true },
    });
    if (existing) {
      throw conflict("プロフィールは登録済みです。");
    }
    throw conflict("このユーザーIDは使われています。", {
      userId: ["このユーザーIDは使われています。"],
    });
  }
});
