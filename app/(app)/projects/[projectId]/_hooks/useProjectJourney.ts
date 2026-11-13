// プロジェクト歩み（月次）を SWR で取得するフック
"use client";

import type { GetProjectJourneyResponse } from "@/app/api/projects/[projectId]/journey/route";
import { ApiClientError } from "@/lib/apiClient";
import useSWR from "swr";

type UseProjectJourneyArgs = {
  projectId: string;
  enabled: boolean;
  year: number | null;
  month: number | null;
};

export function useProjectJourney({ projectId, enabled, year, month }: UseProjectJourneyArgs) {
  const hasBoth = year !== null && month !== null;
  const hasNeither = year === null && month === null;
  const key =
    enabled && (hasBoth || hasNeither)
      ? hasBoth
        ? `/api/projects/${encodeURIComponent(projectId)}/journey?year=${year}&month=${month}`
        : `/api/projects/${encodeURIComponent(projectId)}/journey`
      : null;

  const { data, error, isLoading, mutate } = useSWR<GetProjectJourneyResponse>(key);

  return {
    journey: data,
    isLoading,
    error: error instanceof ApiClientError ? error : error instanceof Error ? error : undefined,
    mutate,
  };
}
