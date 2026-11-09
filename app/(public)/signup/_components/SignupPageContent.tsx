// ユーザー登録画面で、認証状態とURLのstepに応じて認証とプロフィール登録のステップを切り替えるコンポーネント
"use client";

import { LoadingState } from "@/app/_components/common/LoadingState";
import { useAuth } from "@/app/_hooks/useAuth";
import { useGuestOnly } from "../../_hooks/useGuestOnly";
import { GoogleAuthStep } from "./GoogleAuthStep";
import { ProfileForm } from "./ProfileForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// ゲスト制限・状態判定をして、ローディング／ProfileForm／GoogleAuthStep の表示を切り替える
export function SignupPageContent() {
  const searchParams = useSearchParams();
  const isProfileStep = searchParams.get("step") === "profile";
  const router = useRouter();
  useGuestOnly();
  const { status } = useAuth();

  useEffect(() => {
    // プロフィールstepでguestの場合、/signupに戻す
    if (isProfileStep && status === "guest") {
      router.replace("/signup");
    }
  }, [isProfileStep, router, status]);

  if (status === "loading" || status === "ready" || (isProfileStep && status === "guest")) {
    return <LoadingState variant="page" />;
  }

  if (isProfileStep && status === "noProfile") {
    return <ProfileForm />;
  }

  return <GoogleAuthStep />;
}
