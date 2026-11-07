// ログイン画面でゲスト向けにGoogleログインUIを出し、認証済みならローディング／リダイレクト待ちにするコンポーネント
"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { LoadingState } from "@/components/common/LoadingState";
import { useGuestOnly } from "@/hooks/useGuestOnly";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LoginPageContent() {
  const searchParams = useSearchParams();
  // 認証状態の確認
  const { status } = useGuestOnly();
  // URLが?error=authのとき（コールバック失敗など）、AuthCardのalertを設定する
  const alert =
    searchParams.get("error") === "auth"
      ? "Google認証に失敗しました。もう一度お試しください。"
      : null;

  // loadingまたはready（ログイン＋プロフィールあり）のときはLoadingStateを表示
  if (status === "loading" || status === "ready") {
    return <LoadingState variant="page" />;
  }

  return (
    <AuthCard
      title="Googleでログイン"
      description="Googleアカウントでログインします。"
      alert={alert}
      footer={
        <Link href="/signup" className="text-[#0F6E6B] hover:underline">
          アカウントが無い人はユーザー登録へ
        </Link>
      }
    >
      <GoogleAuthButton label="Googleでログイン" />
    </AuthCard>
  );
}
