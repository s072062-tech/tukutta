// ユーザー登録 (/signup)
"use client";

import { LoadingState } from "@/components/common/LoadingState";
import { SignupPageContent } from "@/components/signup/SignupPageContent";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    // Suspenseで読み込み待ちLoadingStateを表示
    <Suspense fallback={<LoadingState variant="page" />}>
      <SignupPageContent />
    </Suspense>
  );
}
