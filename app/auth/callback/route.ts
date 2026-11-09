// Google OAuthなどの認証後コールバック、プロフィール有無に応じて遷移先を決めるAPI 
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 指定パスへリダイレクトし、キャッシュしないレスポンスを返す
function redirectTo(request: Request, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

// codeをセッションに交換し、登録済みなら /home、未登録ならプロフィール登録へ送る
export async function GET(request: Request) {
  // URLからcodeを取得、なければログインエラーへ
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return redirectTo(request, "/login?error=auth");
  }

  // supabaseサーバークライアントで exchangeCodeForSession(code) を実行し、ログインセッションを確立
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  // 失敗またはユーザー情報がなければログインエラーへ
  if (error || !data.user) {
    return redirectTo(request, "/login?error=auth");
  }

  const profile = await prisma.user.findUnique({
    where: { authUserId: data.user.id },
    select: { id: true },
  });

  // プロフィールが登録されていれば /home へ、なければ /signup?step=profile
  return redirectTo(request, profile ? "/home" : "/signup?step=profile");
}
