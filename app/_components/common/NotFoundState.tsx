// 404 not found のときの表示共通コンポーネント
"use client";

import { buttonClassName } from "./Button";
import Link from "next/link";

export function NotFoundState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-base font-medium text-[#1C2B2E]">ページが見つかりません</p>
      <Link href="/home" className={buttonClassName("primary")}>
        ホームへ
      </Link>
    </div>
  );
}
