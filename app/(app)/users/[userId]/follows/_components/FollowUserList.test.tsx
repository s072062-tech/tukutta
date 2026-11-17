// FollowUserList の loading / error / 空表示 / 一覧表示テスト
import { renderWithProviders } from "@/test/renderWithProviders";
import type { FollowListItem } from "@/app/api/users/[userId]/follows/route";
import { ApiClientError } from "@/lib/apiClient";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useFollowList = vi.fn();

vi.mock("../_hooks/useFollowList", () => ({
  useFollowList: (...args: unknown[]) => useFollowList(...args),
}));

vi.mock("./FollowUserRow", () => ({
  FollowUserRow: ({ user }: { user: FollowListItem }) => (
    <div data-testid={`follow-row-${user.userId}`}>{user.name}</div>
  ),
}));

import { FollowUserList } from "./FollowUserList";

const sampleUser: FollowListItem = {
  id: 2,
  userId: "bob",
  name: "Bob",
  isFollowing: false,
  isSelf: false,
};

function mockList(overrides: Record<string, unknown> = {}) {
  useFollowList.mockReturnValue({
    users: [] as FollowListItem[],
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

describe("FollowUserList", () => {
  beforeEach(() => {
    useFollowList.mockReset();
    mockList();
  });

  it("取得中は LoadingState を出す", () => {
    mockList({ isLoading: true });
    renderWithProviders(
      <FollowUserList userId="alice" type="following" />,
    );
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
  });

  it("エラー時は ErrorMessage を出す", () => {
    mockList({
      error: new ApiClientError(500, "INTERNAL_ERROR", "サーバーエラーです。"),
    });
    renderWithProviders(
      <FollowUserList userId="alice" type="following" />,
    );
    expect(screen.getByText("サーバーエラーです。")).toBeInTheDocument();
  });

  it("フォロー中が0件なら空メッセージを出す", () => {
    renderWithProviders(
      <FollowUserList userId="alice" type="following" />,
    );
    expect(
      screen.getByText("フォロー中のユーザーはいません"),
    ).toBeInTheDocument();
    expect(useFollowList).toHaveBeenCalledWith("alice", "following", true);
  });

  it("フォロワーが0件なら空メッセージを出す", () => {
    renderWithProviders(
      <FollowUserList userId="alice" type="followers" />,
    );
    expect(screen.getByText("フォロワーはいません")).toBeInTheDocument();
    expect(useFollowList).toHaveBeenCalledWith("alice", "followers", true);
  });

  it("ユーザーがいれば行を表示する", () => {
    mockList({ users: [sampleUser] });
    renderWithProviders(
      <FollowUserList userId="alice" type="following" />,
    );
    expect(screen.getByTestId("follow-row-bob")).toHaveTextContent("Bob");
  });
});
