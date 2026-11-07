"use client";

import { buttonClassName } from "@/components/common/Button";
import Link from "next/link";

type PublicHeaderProps = {
  showLogin: boolean;
  showSignup: boolean;
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[#1C2B2E]">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0F6E6B] text-sm font-bold text-white">
        つ
      </span>
      つくったー
    </Link>
  );
}

export function PublicHeader({ showLogin, showSignup }: PublicHeaderProps) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-[#DEE7E9] px-6 md:px-12">
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
