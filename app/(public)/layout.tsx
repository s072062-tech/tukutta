// 公開ページのヘッダーあり共通レイアウト (/, /signup, /login)
"use client";

import { PublicHeader } from "./_components/PublicHeader";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F3F6F7]">
      {/* ヘッダー表示、 login と signup で切り替え*/}
      <PublicHeader showLogin={pathname !== "/login"} showSignup={pathname !== "/signup"} />
      <main className="px-4 py-16">{children}</main>
    </div>
  );
}
