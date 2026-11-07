// ログイン (/login)
"use client";

import { LoginPageContent } from "@/components/login/LoginPageContent";
import { LoadingState } from "@/components/common/LoadingState";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    // Suspenseで読み込み待ちLoadingStateを表示
    <Suspense fallback={<LoadingState variant="page" />}>
      <LoginPageContent />
    </Suspense>
  );
}
