// ユーザー登録の第1ステップ（Google 認証）画面コンポーネント
"use client";

import { AuthCard } from "../../_components/AuthCard";
import { GoogleAuthButton } from "../../_components/GoogleAuthButton";
import { SignupSteps } from "./SignupSteps";
import Link from "next/link";

export function GoogleAuthStep() {
  return (
    <AuthCard
      header={<SignupSteps currentStep={1} />}
      title="Googleで認証する"
      description="Googleアカウントでログインし、次にユーザー名とユーザーIDを登録してください。"
      footer={
        <Link href="/login" className="text-[#0F6E6B] hover:underline">
          登録済みの人はログインへ
        </Link>
      }
    >
      <GoogleAuthButton label="Googleで認証する" />
    </AuthCard>
  );
}
