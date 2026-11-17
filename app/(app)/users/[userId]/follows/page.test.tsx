// フォロー一覧ページの loading / 404 / タブ切替 / 空表示テスト
import "@/test/mocks/navigation";
import {
  mockParams,
  mockRouter,
  mockSearchParams,
  resetNavigationMocks,
} from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ApiClientError } from "@/lib/apiClient";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useUserProfile = vi.fn();
const useFollowList = vi.fn();

vi.mock("../_hooks/useUserProfile", () => ({
  useUserProfile: (...args: unknown[]) => useUserProfile(...args),
}));

vi.mock("./_hooks/useFollowList", () => ({
  useFollowList: (...args: unknown[]) => useFollowList(...args),
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

import FollowsPage from "./page";

const profile = {
  user: { id: 1, userId: "alice", name: "Alice" },
  followingCount: 2,
  followerCount: 3,
  isSelf: true,
  isFollowing: false,
  isMuted: false,
};

function mockList(overrides: Record<string, unknown> = {}) {
  useFollowList.mockReturnValue({
    users: [],
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
    error: null,
    isNotFound: false,
    mutate: vi.fn(),
    updateFollow: vi.fn(),
    ...overrides,
  });
}

describe("FollowsPage", () => {
  beforeEach(() => {
    resetNavigationMocks();
    useUserProfile.mockReset();
    useFollowList.mockReset();
    mockParams.userId = "alice";
  });

  it("プロフィール取得中は LoadingState を出す", () => {
    useUserProfile.mockReturnValue({
      profile: null,
      isLoading: true,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    mockList({ isLoading: true });
    renderWithProviders(<FollowsPage />);
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
  });

  it("存在しないユーザーは NotFoundState を出す", () => {
    useUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      isNotFound: true,
      error: new ApiClientError(404, "NOT_FOUND", "対象が見つかりません。"),
      mutate: vi.fn(),
    });
    mockList({ isNotFound: true });
    renderWithProviders(<FollowsPage />);
    expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();
  });

  it("フォロワータブへ切り替えると URL を replace する", () => {
    useUserProfile.mockReturnValue({
      profile,
      isLoading: false,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    mockList();
    renderWithProviders(<FollowsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "フォロワー" }));
    expect(mockRouter.replace).toHaveBeenCalledWith(
      "/users/alice/follows?type=followers",
      { scroll: false },
    );
  });

  it("フォロー中が0件なら空メッセージを出す", () => {
    useUserProfile.mockReturnValue({
      profile,
      isLoading: false,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    mockList();
    renderWithProviders(<FollowsPage />);
    expect(screen.getByText("フォロー中のユーザーはいません")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Alice/ })).toHaveAttribute(
      "href",
      "/users/alice",
    );
  });

  it("type=followers ならフォロワーの空メッセージを出す", () => {
    mockSearchParams.set("type", "followers");
    useUserProfile.mockReturnValue({
      profile,
      isLoading: false,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    mockList();
    renderWithProviders(<FollowsPage />);
    expect(screen.getByText("フォロワーはいません")).toBeInTheDocument();
  });

  it("不正な type でもフォロー中タブとして扱う", () => {
    mockSearchParams.set("type", "xxx");
    useUserProfile.mockReturnValue({
      profile,
      isLoading: false,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    mockList();
    renderWithProviders(<FollowsPage />);
    expect(screen.getByRole("tab", { name: "フォロー中" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(useFollowList).toHaveBeenCalledWith("alice", "following", true);
  });
});
