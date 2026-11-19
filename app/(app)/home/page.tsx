// ホーム (/home)
"use client";

import { PostForm } from "@/app/(app)/home/_components/PostForm";
import { PostSearchBox } from "@/app/(app)/home/_components/PostSearchBox";
import { Timeline } from "@/app/(app)/home/_components/Timeline";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { useAuth } from "@/app/_hooks/useAuth";
import type { PostListTab } from "@/lib/validations/post";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// クエリのtabを有効なタブに正規化し、不正ならlatestにする
function resolveTab(raw: string | null): PostListTab {
  if (
    raw === "following" ||
    raw === "progress" ||
    raw === "latest" ||
    raw === "favorites"
  ) {
    return raw;
  }
  return "latest";
}

// タブと検索語から /home のURLを組み立てる
function buildHomePath(tab: PostListTab, q: string | null) {
  const params = new URLSearchParams();
  if (tab !== "latest") {
    params.set("tab", tab);
  }
  if (q) {
    params.set("q", q);
  }
  const query = params.toString();
  return query ? `/home?${query}` : "/home";
}

// 認証チェックとURL同期を行い、フォーム・検索・タイムラインを描画
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useAuth();

  const tab = resolveTab(searchParams.get("tab"));
  const qRaw = searchParams.get("q");
  const q = qRaw && qRaw.trim() ? qRaw.trim() : null;

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (tab !== "following" && tab !== "favorites") {
      return;
    }
    if (status === "guest") {
      router.replace("/login");
      return;
    }
    if (status === "noProfile") {
      router.replace("/signup?step=profile");
    }
  }, [status, tab, router]);

  // タブ変更をURLに反映する
  const handleTabChange = (nextTab: PostListTab) => {
    router.replace(buildHomePath(nextTab, q), { scroll: false });
  };

  // 検索語変更をURLに反映する
  const handleSearch = (nextQ: string | null) => {
    router.replace(buildHomePath(tab, nextQ), { scroll: false });
  };

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-[#1C2B2E]">ホーム</h1>

          <div className="mt-4 lg:hidden">
            <PostSearchBox query={q ?? ""} onSearch={handleSearch} />
          </div>

          <div className="mt-4">
            <PostForm />
          </div>

          <Timeline tab={tab} q={q} onTabChange={handleTabChange} />
        </div>

        <div className="hidden w-80 shrink-0 lg:block">
          <PostSearchBox query={q ?? ""} onSearch={handleSearch} />
        </div>
      </div>
    </div>
  );
}

// useSearchParams用にSuspenseでHomeContentを出す
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <HomeContent />
    </Suspense>
  );
}
