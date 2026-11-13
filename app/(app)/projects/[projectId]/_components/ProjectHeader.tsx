// プロジェクト詳細ヘッダー（名前・編集／フォロー・概要・登録者・スタンプ）
"use client";

import type { FollowProjectResponse } from "@/app/api/projects/[projectId]/follow/route";
import type { GetProjectResponse } from "@/app/api/projects/[projectId]/route";
import { StampBar } from "@/app/_components/common/StampBar";
import { UserNameLink } from "@/app/_components/common/UserNameLink";
import { buttonClassName } from "@/app/_components/common/Button";
import { Gamepad2, Pencil } from "lucide-react";
import Link from "next/link";
import { ProjectFollowButton } from "./ProjectFollowButton";

type ProjectHeaderProps = {
  projectId: number;
  detail: GetProjectResponse;
  onFollowChange: (result: FollowProjectResponse) => void;
  onSendStamp: (emoji: string) => Promise<void>;
  stampDisabled: boolean;
  stampError?: string | null;
};

export function ProjectHeader({
  projectId,
  detail,
  onFollowChange,
  onSendStamp,
  stampDisabled,
  stampError = null,
}: ProjectHeaderProps) {
  return (
    <section className="rounded-2xl border border-[#DEE7E9] bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F3F1] text-[#0F6E6B]">
          <Gamepad2 className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold text-[#1C2B2E]">{detail.project.name}</h1>
            {detail.isOwner ? (
              <Link
                href={`/projects/${projectId}/edit`}
                className={buttonClassName("secondary", "h-9 shrink-0 px-3")}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                編集
              </Link>
            ) : (
              <ProjectFollowButton
                projectId={projectId}
                isFollowing={detail.isFollowing}
                onChange={onFollowChange}
              />
            )}
          </div>
          {detail.project.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#1C2B2E]">
              {detail.project.description}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-[#6A7B82]">
            登録者{" "}
            <span className="text-[#1C2B2E]">
              <UserNameLink user={detail.owner} />
            </span>
          </p>
          <div className="mt-4">
            <StampBar
              stamps={detail.stamps}
              onSend={onSendStamp}
              disabled={stampDisabled}
            />
            {stampError ? (
              <p className="mt-2 text-sm text-[#B42318]">{stampError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
