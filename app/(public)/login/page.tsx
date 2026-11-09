// ログイン (/login)
"use client";

import { LoadingState } from "@/app/_components/common/LoadingState";
import { LoginPageContent } from "./_components/LoginPageContent";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    // Suspenseで読み込み待ちLoadingStateを表示
    <Suspense fallback={<LoadingState variant="page" />}>
      <LoginPageContent />
    </Suspense>
  );
}
