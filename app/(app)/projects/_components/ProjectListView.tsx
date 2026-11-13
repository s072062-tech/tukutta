// プロジェクト一覧のタブ・検索・カード列・状態表示
"use client";

import { EmptyState } from "@/app/_components/common/EmptyState";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadMoreButton } from "@/app/_components/common/LoadMoreButton";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { ProjectCard } from "@/app/_components/common/ProjectCard";
import { Tabs } from "@/app/_components/common/Tabs";
import { useAuth } from "@/app/_hooks/useAuth";
import { ApiClientError } from "@/lib/apiClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProjectList } from "../_hooks/useProjectList";
import { ProjectSearchInput } from "./ProjectSearchInput";

const TAB_ITEMS = [
  { key: "all", label: "全ユーザー" },
  { key: "following", label: "フォロー" },
] as const;

function resolveTab(raw: string | null): "all" | "following" {
  return raw === "following" ? "following" : "all";
}

function emptyMessage(tab: "all" | "following", q: string) {
  if (q) {
    return "該当するプロジェクトがありません";
  }
  if (tab === "following") {
    return "フォロー中のプロジェクトはありません";
  }
  return "まだプロジェクトがありません";
}

function buildProjectsPath(tab: "all" | "following", q: string) {
  const params = new URLSearchParams();
  if (tab === "following") {
    params.set("tab", "following");
  }
  if (q) {
    params.set("q", q);
  }
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

// クエリの読み書きと一覧表示をまとめる
export function ProjectListView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, mutate: mutateAuth } = useAuth();

  const tab = resolveTab(searchParams.get("tab"));
  const q = searchParams.get("q") ?? "";
  const [keyword, setKeyword] = useState(q);

  useEffect(() => {
    setKeyword(q);
  }, [q]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (tab !== "following") {
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

  const {
    projects,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error,
    mutate,
  } = useProjectList({ tab, q, status });

  useEffect(() => {
    if (!error) {
      return;
    }
    if (error.status === 401) {
      void mutateAuth().then(() => {
        router.replace("/login");
      });
      return;
    }
    if (error.status === 403 && error.code === "PROFILE_REQUIRED") {
      router.replace("/signup?step=profile");
    }
  }, [error, mutateAuth, router]);

  const handleTabChange = (key: string) => {
    if (key === "following") {
      if (status === "guest") {
        router.replace("/login");
        return;
      }
      if (status === "noProfile") {
        router.replace("/signup?step=profile");
        return;
      }
      if (status !== "ready") {
        return;
      }
    }
    const nextTab = key === "following" ? "following" : "all";
    router.replace(buildProjectsPath(nextTab, q), { scroll: false });
  };

  const handleSearchSubmit = () => {
    const nextQ = keyword.trim();
    router.replace(buildProjectsPath(tab, nextQ), { scroll: false });
  };

  const showAuthRedirect =
    tab === "following" && (status === "loading" || status === "guest" || status === "noProfile");
  const showListLoading = !showAuthRedirect && isLoading && projects.length === 0;
  const showError =
    error instanceof ApiClientError &&
    error.status !== 401 &&
    !(error.status === 403 && error.code === "PROFILE_REQUIRED");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-xl font-bold text-[#1C2B2E]">プロジェクト一覧</h1>

      <div className="mt-6">
        <Tabs
          items={[...TAB_ITEMS]}
          activeKey={showAuthRedirect ? "all" : tab}
          onChange={handleTabChange}
        />
      </div>

      <div className="mt-4">
        <ProjectSearchInput value={keyword} onChange={setKeyword} onSubmit={handleSearchSubmit} />
      </div>

      {showAuthRedirect ? (
        <div className="mt-6">
          <LoadingState variant="list" />
        </div>
      ) : null}

      {!showAuthRedirect && showListLoading ? (
        <div className="mt-6">
          <LoadingState variant="list" />
        </div>
      ) : null}

      {!showAuthRedirect && showError ? (
        <div className="mt-6">
          <ErrorMessage message={error.message} onRetry={() => void mutate()} />
        </div>
      ) : null}

      {!showAuthRedirect && !showListLoading && !showError ? (
        <div className="mt-6 space-y-3">
          {total != null && total >= 1 ? (
            <p className="text-sm text-[#6A7B82]">{total}件のプロジェクト</p>
          ) : null}
          {projects.length === 0 ? (
            <EmptyState message={emptyMessage(tab, q)} />
          ) : (
            <>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
              <LoadMoreButton hasMore={hasMore} isLoading={isLoadingMore} onClick={loadMore} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
