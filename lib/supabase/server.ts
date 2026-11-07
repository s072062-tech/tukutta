// サーバー側処理がsupabaseのログイン状態を読み書きするためのクライアントを作成する
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバー用supabaseクライアント作成
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase の環境変数が設定されていません。");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      // リクエストのCookieを全部読む
      getAll() {
        return cookieStore.getAll();
      },
      // supabaseが更新したCookieをレスポンスへ書く
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server ComponentからはCookieを書けない。更新はproxyが行う。
        }
      },
    },
  });
}
