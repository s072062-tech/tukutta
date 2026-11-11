// ユーザー情報のプロジェクトタブの表示内容コンポーネント
"use client";

import type { CreateProjectResponse } from "@/app/api/projects/route";
import { EmptyState } from "@/app/_components/common/EmptyState";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { ProjectCard } from "@/app/_components/common/ProjectCard";
import { ProjectForm } from "../../../_components/ProjectForm";
import { useUserProjects } from "../_hooks/useUserProjects";
import { apiPost } from "@/lib/apiClient";
import type { ProjectFormValues } from "@/lib/validations/project";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type UserProjectsSectionProps = {
  userId: string;
  isSelf: boolean;
};

// プロジェクト登録フォームとプロジェクト一覧を表示
export function UserProjectsSection({ userId, isSelf }: UserProjectsSectionProps) {
  const router = useRouter();
  const { projects, isLoading, error, mutate } = useUserProjects(userId, true);

  // プロジェクトを API で作成し、一覧を更新して詳細ページへ遷移する
  const handleCreate = async (values: ProjectFormValues) => {
    const body = await apiPost<CreateProjectResponse>("/api/projects", values);
    await mutate();
    router.push(`/projects/${body.project.id}`);
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-[#1C2B2E]">プロジェクト</h2>

      {isSelf ? (
        <div className="rounded-2xl border border-[#DEE7E9] bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-[#1C2B2E]">プロジェクトを登録</h3>
          <ProjectForm
            submitLabel="登録する"
            submitIcon={<Plus className="h-4 w-4" />}
            onSubmit={handleCreate}
          />
        </div>
      ) : null}

      {isLoading ? <LoadingState variant="list" /> : null}

      {!isLoading && error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : "エラーが発生しました。"}
          onRetry={() => void mutate()}
        />
      ) : null}

      {!isLoading && !error && projects.length === 0 ? (
        <EmptyState message="まだプロジェクトがありません" />
      ) : null}

      {!isLoading && !error && projects.length > 0 ? (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
