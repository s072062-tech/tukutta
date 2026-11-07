// ユーザー本人のログイン状態確認API
import { getAuthContext } from "@/lib/api/auth";
import { withErrorHandling } from "@/lib/api/errors";

// ユーザー情報
export type UserSelf = {
  id: number;
  userId: string;
  name: string;
};

// ログイン状態
export type GetMeResponse =
  | { status: "guest"; user: null }   // Google認証なし
  | { status: "noProfile"; user: null; email: string | null }   // Google認証あり、ユーザー登録なし
  | { status: "ready"; user: UserSelf };  // Google認証あり、ユーザー登録あり

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
