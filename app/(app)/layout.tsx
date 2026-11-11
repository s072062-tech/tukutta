// アプリ側の共通レイアウト
"use client";

import { SideMenu } from "./_components/SideMenu";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#F3F6F7]">
      <SideMenu />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
