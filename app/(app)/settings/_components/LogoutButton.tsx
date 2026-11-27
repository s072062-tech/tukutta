// アプリ設定画面のログアウトボタンコンポーネント
"use client";

import { Button } from "@/app/_components/common/Button";
import { useAuth } from "@/app/_hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LOGOUT_ERROR_MESSAGE =
  "ログアウトできませんでした。時間をおいて再度お試しください。";

export function LogoutButton() {
  const router = useRouter();
  const { mutate } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(LOGOUT_ERROR_MESSAGE);
        return;
      }
      await mutate();
      router.push("/");
    } catch {
      setError(LOGOUT_ERROR_MESSAGE);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        isLoading={isSigningOut}
        onClick={handleLogout}
      >
        ログアウト
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
