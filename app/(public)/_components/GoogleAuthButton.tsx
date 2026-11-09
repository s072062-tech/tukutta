// Google認証を実行するボタン
"use client";

import { Button } from "@/app/_components/common/Button";
import { useGoogleSignIn } from "../_hooks/useGoogleSignIn";
import { LogIn } from "lucide-react";

type GoogleAuthButtonProps = {
  label: string;
};

// useGoogleSignInでGoogle認証を行い、失敗した場合はエラーを表示
export function GoogleAuthButton({ label }: GoogleAuthButtonProps) {
  const { signIn, isRedirecting, error } = useGoogleSignIn();

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="primary"
        className="w-full"
        icon={<LogIn className="h-4 w-4" aria-hidden />}
        isLoading={isRedirecting}
        onClick={() => {
          void signIn();
        }}
      >
        {label}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
