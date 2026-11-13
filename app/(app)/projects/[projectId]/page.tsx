// プロジェクト情報画面 (/projects/{projectId})
"use client";

import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { ApiClientError } from "@/lib/apiClient";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProjectDetailView } from "./_components/ProjectDetailView";
import { useProjectDetail } from "./_hooks/useProjectDetail";

function resolveTab(raw: string | null): "tasks" | "journey" {
  return raw === "journey" ? "journey" : "tasks";
}

function parseOptionalInt(raw: string | null) {
  if (raw === null || raw === "") {
    return null;
  }
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function ProjectDetailPageContent() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const projectId = typeof params.projectId === "string" ? params.projectId : undefined;
  const tab = resolveTab(searchParams.get("tab"));
  const year = parseOptionalInt(searchParams.get("year"));
  const month = parseOptionalInt(searchParams.get("month"));

  const { detail, isLoading, isNotFound, error, mutate } = useProjectDetail(projectId);

  if (!projectId) {
    return <NotFoundState />;
  }

  if (isLoading) {
    return <LoadingState variant="page" />;
  }

  if (isNotFound) {
    return <NotFoundState />;
  }

  if (error || !detail) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            error instanceof ApiClientError
              ? error.message
              : "エラーが発生しました。時間をおいて再度お試しください。"
          }
          onRetry={() => void mutate()}
        />
      </div>
    );
  }

  return (
    <ProjectDetailView
      projectId={projectId}
      tab={tab}
      year={year}
      month={month}
      detail={detail}
      mutateDetail={mutate}
    />
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <ProjectDetailPageContent />
    </Suspense>
  );
}
