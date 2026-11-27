// 公開ページの共通ヘッダーコンポーネント
"use client";

import { buttonClassName } from "@/app/_components/common/Button";
import Link from "next/link";

type PublicHeaderProps = {
  showLogin: boolean;
  showSignup: boolean;
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-bold text-fg">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent text-sm font-bold text-white">
        つ
      </span>
      つくったー
    </Link>
  );
}

export function PublicHeader({ showLogin, showSignup }: PublicHeaderProps) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-border px-6 md:px-12">
      <Logo />
      <div className="flex items-center gap-3">
        {showLogin ? (
          <Link href="/login" className={buttonClassName("secondary")}>
            ログイン
          </Link>
        ) : null}
        {showSignup ? (
          <Link href="/signup" className={buttonClassName("primary")}>
            ユーザー登録
          </Link>
        ) : null}
      </div>
    </header>
  );
}
