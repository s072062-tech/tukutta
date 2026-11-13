// プロジェクト詳細の本体（ヘッダー・タブ・タスク／歩み・スタンプ楽観更新）
"use client";

import type { FollowProjectResponse } from "@/app/api/projects/[projectId]/follow/route";
import type { GetProjectJourneyResponse } from "@/app/api/projects/[projectId]/journey/route";
import type { GetProjectResponse } from "@/app/api/projects/[projectId]/route";
import type { SendProjectStampResponse } from "@/app/api/projects/[projectId]/stamps/route";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { Tabs } from "@/app/_components/common/Tabs";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { ApiClientError, apiPost } from "@/lib/apiClient";
import type { StampSummary } from "@/types/stamp";
import type { KeyedMutator } from "swr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProjectJourney } from "../_hooks/useProjectJourney";
import { JourneyCalendar } from "./JourneyCalendar";
import { ProjectHeader } from "./ProjectHeader";
import { TaskSection } from "./TaskSection";

const TAB_ITEMS = [
  { key: "tasks", label: "タスク一覧" },
  { key: "journey", label: "歩み" },
] as const;

type ProjectDetailViewProps = {
  projectId: string;
  tab: "tasks" | "journey";
  year: number | null;
  month: number | null;
  detail: GetProjectResponse;
  mutateDetail: KeyedMutator<GetProjectResponse>;
};

// スタンプを件数降順・絵文字昇順で並べ替える
function sortStamps(stamps: StampSummary[]) {
  return [...stamps].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.emoji.localeCompare(b.emoji);
  });
}

// 送信前にスタンプ一覧へ件数＋1（または新規追加）を反映する
function applyOptimisticStamp(stamps: StampSummary[], emoji: string) {
  const existing = stamps.find((stamp) => stamp.emoji === emoji);
  if (existing) {
    return sortStamps(
      stamps.map((stamp) =>
        stamp.emoji === emoji
          ? { ...stamp, count: stamp.count + 1, sentByMe: true }
          : stamp,
      ),
    );
  }
  return sortStamps([...stamps, { emoji, count: 1, sentByMe: true }]);
}

// 年月を指定した分だけ前後にずらす
function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

// 詳細UI全体を描画し、フォロー・スタンプ・タブ・歩みを制御する
export function ProjectDetailView({
  projectId,
  tab,
  year,
  month,
  detail,
  mutateDetail,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const { ensureLoggedIn } = useLoginGuard();
  const [sendingEmoji, setSendingEmoji] = useState<string | null>(null);
  const [stampError, setStampError] = useState<string | null>(null);

  const {
    journey,
    isLoading: journeyLoading,
    error: journeyError,
    mutate: mutateJourney,
  } = useProjectJourney({
    projectId,
    enabled: tab === "journey",
    year,
    month,
  });

  const displayYear = year ?? journey?.year;
  const displayMonth = month ?? journey?.month;

  // URLのtabを付け替えてタスク／歩みを切り替える
  const handleTabChange = (key: string) => {
    if (key === "journey") {
      router.replace(`/projects/${projectId}?tab=journey`, { scroll: false });
      return;
    }
    router.replace(`/projects/${projectId}`, { scroll: false });
  };

  // 歩みタブの表示月をURLクエリで更新する
  const goToMonth = (nextYear: number, nextMonth: number) => {
    router.replace(
      `/projects/${projectId}?tab=journey&year=${nextYear}&month=${nextMonth}`,
      { scroll: false },
    );
  };

  // フォロー結果を詳細キャッシュに即時反映する
  const handleFollowChange = (result: FollowProjectResponse) => {
    void mutateDetail(
      (current): GetProjectResponse | undefined =>
        current ? { ...current, isFollowing: result.isFollowing } : current,
      { revalidate: false },
    );
  };

  // ログイン確認後、楽観更新しつつスタンプAPIを呼ぶ
  const handleSendStamp = async (emoji: string) => {
    if (!ensureLoggedIn()) {
      return;
    }
    setStampError(null);
    setSendingEmoji(emoji);
    const previous = detail.stamps;
    const optimistic = applyOptimisticStamp(previous, emoji);
    void mutateDetail(
      (current): GetProjectResponse | undefined =>
        current ? { ...current, stamps: optimistic } : current,
      { revalidate: false },
    );

    try {
      const stamps = await apiPost<SendProjectStampResponse>(
        `/api/projects/${projectId}/stamps`,
        { emoji },
      );
      void mutateDetail(
        (current): GetProjectResponse | undefined =>
          current ? { ...current, stamps } : current,
        { revalidate: false },
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setStampError(error.message);
        void mutateDetail();
      } else {
        void mutateDetail(
          (current): GetProjectResponse | undefined =>
            current ? { ...current, stamps: previous } : current,
          { revalidate: false },
        );
        setStampError(
          error instanceof ApiClientError
            ? error.message
            : "スタンプを送信できませんでした。",
        );
      }
    } finally {
      setSendingEmoji(null);
    }
  };

  // タスク作成後に詳細データを再取得する
  const handleTaskCreated = async () => {
    await mutateDetail();
  };

  // 歩みタブのロード／エラー／カレンダー表示を切り替える
  const renderJourney = () => {
    if (year !== null && month !== null) {
      if (journeyLoading || !journey) {
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-[#1C2B2E]">
              {year}年{month}月
            </p>
            {journeyError ? (
              <ErrorMessage
                message={
                  journeyError instanceof ApiClientError
                    ? journeyError.message
                    : "エラーが発生しました。時間をおいて再度お試しください。"
                }
                onRetry={() => void mutateJourney()}
              />
            ) : (
              <LoadingState variant="card" />
            )}
          </div>
        );
      }
    } else if (journeyLoading || !journey) {
      return journeyError ? (
        <ErrorMessage
          message={
            journeyError instanceof ApiClientError
              ? journeyError.message
              : "エラーが発生しました。時間をおいて再度お試しください。"
          }
          onRetry={() => void mutateJourney()}
        />
      ) : (
        <LoadingState variant="card" />
      );
    }

    if (journeyError) {
      return (
        <ErrorMessage
          message={
            journeyError instanceof ApiClientError
              ? journeyError.message
              : "エラーが発生しました。時間をおいて再度お試しください。"
          }
          onRetry={() => void mutateJourney()}
        />
      );
    }

    const resolved = journey as GetProjectJourneyResponse;
    const y = displayYear ?? resolved.year;
    const m = displayMonth ?? resolved.month;

    return (
      <JourneyCalendar
        year={y}
        month={m}
        days={resolved.days}
        onPrev={() => {
          const next = shiftMonth(y, m, -1);
          goToMonth(next.year, next.month);
        }}
        onNext={() => {
          const next = shiftMonth(y, m, 1);
          goToMonth(next.year, next.month);
        }}
      />
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <ProjectHeader
        projectId={detail.project.id}
        detail={detail}
        onFollowChange={handleFollowChange}
        onSendStamp={handleSendStamp}
        stampDisabled={sendingEmoji !== null}
        stampError={stampError}
      />
      <Tabs items={[...TAB_ITEMS]} activeKey={tab} onChange={handleTabChange} />
      {tab === "tasks" ? (
        <TaskSection
          projectId={projectId}
          tasks={detail.tasks}
          isOwner={detail.isOwner}
          onCreated={handleTaskCreated}
        />
      ) : (
        renderJourney()
      )}
    </div>
  );
}
