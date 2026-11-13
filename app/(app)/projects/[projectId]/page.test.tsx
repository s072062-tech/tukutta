// プロジェクト詳細ページの 404 / エラー分岐テスト
import "@/test/mocks/navigation";
import { mockParams, resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ApiClientError } from "@/lib/apiClient";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useProjectDetail = vi.fn();

vi.mock("./_hooks/useProjectDetail", () => ({
  useProjectDetail: (...args: unknown[]) => useProjectDetail(...args),
}));

vi.mock("./_components/ProjectDetailView", () => ({
  ProjectDetailView: () => <div>詳細ビュー</div>,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import ProjectDetailPage from "./page";

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    resetNavigationMocks();
    useProjectDetail.mockReset();
    mockParams.projectId = "10";
  });

  it("404 のとき NotFoundState を出す", () => {
    useProjectDetail.mockReturnValue({
      detail: null,
      isLoading: false,
      isNotFound: true,
      error: new ApiClientError(404, "NOT_FOUND", "見つかりません。"),
      mutate: vi.fn(),
    });
    renderWithProviders(<ProjectDetailPage />);
    expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();
  });

  it("取得失敗のとき ErrorMessage を出す", () => {
    useProjectDetail.mockReturnValue({
      detail: null,
      isLoading: false,
      isNotFound: false,
      error: new ApiClientError(500, "INTERNAL_ERROR", "失敗しました"),
      mutate: vi.fn(),
    });
    renderWithProviders(<ProjectDetailPage />);
    expect(screen.getByText("失敗しました")).toBeInTheDocument();
  });
});
