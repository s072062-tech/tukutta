// 認証API処理
// リクエストのログイン状態と、アプリ側のユーザー情報を取得
import type { User as AuthUser } from "@supabase/supabase-js";
import type { User } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { profileRequired, unauthorized } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function getAuthContext(): Promise<{
  authUser: AuthUser | null;
  user: User | null;
}> {
  // Cookieが有効なsupabaseユーザーか確認
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  // 認証情報がなければnull
  if (!authUser) {
    return { authUser: null, user: null };
  }

  // supabaseの認証ユーザーIDで、アプリ側のユーザー情報取得
  const user = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
  });
  return { authUser, user };
}

// アプリ側のユーザー情報だけ取得
export async function getViewer() {
  const { user } = await getAuthContext();
  return user;
}

// 認証とユーザー情報登録が済んでいる場合のみユーザー情報取得
export async function requireUser() {
  const { authUser, user } = await getAuthContext();
  if (!authUser) {
    throw unauthorized();
  }
  if (!user) {
    throw profileRequired();
  }
  return user;
}
