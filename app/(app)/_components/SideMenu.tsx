// アプリページの共通サイドメニューコンポーネント
"use client";

import { Avatar } from "@/app/_components/common/Avatar";
import { buttonClassName } from "@/app/_components/common/Button";
import { UserNameLink } from "@/app/_components/common/UserNameLink";
import { useAuth } from "@/app/_hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";
import { Folder, Home, Settings } from "lucide-react";    // フォルダなどのアイコン
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";

type MenuItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const baseItems: MenuItem[] = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/projects", label: "プロジェクト一覧", icon: Folder },
];

const settingsItem: MenuItem = { href: "/settings", label: "アプリ設定", icon: Settings };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 別画面へのリンクと自ユーザー情報を表示
export function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, me, mutate } = useAuth();
  const items = status === "ready" ? [...baseItems, settingsItem] : baseItems;

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    await mutate();
    router.push("/");
  };

  return (
    <aside className="flex w-[228px] shrink-0 flex-col border-r border-[#DEE7E9] bg-[#F3F6F7]">
      <div className="px-6 pt-6">
        <Link href="/home" className="flex items-center gap-2 text-lg font-bold text-[#1C2B2E]">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0F6E6B] text-sm font-bold text-white">
            つ
          </span>
          つくったー
        </Link>
      </div>
      <nav className="mt-8 flex flex-col gap-1 px-6">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex h-12 items-center gap-2 rounded-lg px-3 text-sm",
                active ? "bg-[#E7F3F1] font-medium text-[#0F6E6B]" : "text-[#1C2B2E] hover:bg-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[#DEE7E9] px-6 py-6">
        {status === "guest" ? (
          <div className="flex flex-col gap-2">
            <Link href="/login" className={buttonClassName("secondary", "w-full")}>
              ログイン
            </Link>
            <Link href="/signup" className={buttonClassName("primary", "w-full")}>
              ユーザー登録
            </Link>
          </div>
        ) : null}
        {status === "noProfile" ? (
          <Link href="/signup" className={buttonClassName("primary", "w-full")}>
            プロフィールを登録
          </Link>
        ) : null}
        {status === "ready" && me ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={me.name} id={me.id} userId={me.userId} size="md" />
              <UserNameLink user={me} />
            </div>
            <button type="button" className={buttonClassName("ghost", "w-full")} onClick={logout}>
              ログアウト
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
