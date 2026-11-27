// ユーザー本人のログイン状態確認・ユーザー名変更・アカウント削除 API
import { getAuthContext, requireUser } from "@/lib/api/auth";
import { validationError, withErrorHandling } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateMeSchema,
  type UpdateMeFormValues,
} from "@/lib/validations/user";
import { ZodError } from "zod";

// ユーザー情報
export type UserSelf = {
  id: number;
  userId: string;
  name: string;
};

// ログイン状態
export type GetMeResponse =
  | { status: "guest"; user: null } // Google認証なし
  | { status: "noProfile"; user: null; email: string | null } // Google認証あり、ユーザー登録なし
  | { status: "ready"; user: UserSelf }; // Google認証あり、ユーザー登録あり

export type UpdateMeRequest = UpdateMeFormValues;

export type UpdateMeResponse = {
  status: "ready";
  user: UserSelf;
};

export type DeleteMeResponse = { ok: true };

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const GET = withErrorHandling(async () => {
  // supabaseの認証ユーザー情報と、アプリ側のユーザー情報取得
  const { authUser, user } = await getAuthContext();

  if (!authUser) {
    const body: GetMeResponse = { status: "guest", user: null };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  }

  if (!user) {
    const body: GetMeResponse = {
      status: "noProfile",
      user: null,
      email: authUser.email ?? null,
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  }

  const body: GetMeResponse = {
    status: "ready",
    user: { id: user.id, userId: user.userId, name: user.name },
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
});

// ログイン中ユーザーのユーザー名を更新する
export const PATCH = withErrorHandling(async (request) => {
  const user = await requireUser();

  const rawBody = await readJson(request);
  if (rawBody === null) {
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

  const { name } = updateMeSchema.parse(rawBody);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name },
    select: { id: true, userId: true, name: true },
  });

  const body: UpdateMeResponse = {
    status: "ready",
    user: updated,
  };
  return Response.json(body);
});

// ログイン中ユーザーのアカウントと関連データを削除する
export const DELETE = withErrorHandling(async () => {
  const user = await requireUser();
  const { id, authUserId } = user;

  await prisma.user.delete({ where: { id } });

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(authUserId);
    if (error) {
      console.error(
        "[DELETE /api/user-self] Auth user delete failed after Prisma delete:",
        authUserId,
        error.message,
      );
    }
  } catch (error) {
    console.error(
      "[DELETE /api/user-self] Auth user delete failed after Prisma delete:",
      authUserId,
      error,
    );
  }

  const body: DeleteMeResponse = { ok: true };
  return Response.json(body);
});
