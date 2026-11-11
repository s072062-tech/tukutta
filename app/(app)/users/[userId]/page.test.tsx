// ユーザー情報ページの loading / 404 / タブ切替テスト
import "@/test/mocks/navigation";
import { mockParams, mockRouter, mockSearchParams, resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ApiClientError } from "@/lib/apiClient";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useUserProfile = vi.fn();

vi.mock("./_hooks/useUserProfile", () => ({
  useUserProfile: (...args: unknown[]) => useUserProfile(...args),
}));

vi.mock("./_components/UserProjectsSection", () => ({
  UserProjectsSection: () => <div>projects-section</div>,
}));

vi.mock("./_components/UserPostsSection", () => ({
  UserPostsSection: () => <div>posts-section</div>,
}));

vi.mock("./_components/ProfileCard", () => ({
  ProfileCard: ({ profile }: { profile: { user: { name: string } } }) => (
    <div>profile:{profile.user.name}</div>
  ),
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

import UserProfilePage from "./page";

describe("UserProfilePage", () => {
  beforeEach(() => {
    resetNavigationMocks();
    useUserProfile.mockReset();
    mockParams.userId = "satogames";
  });

  it("読み込み中は LoadingState を出す", () => {
    useUserProfile.mockReturnValue({
      profile: null,
      isLoading: true,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    renderWithProviders(<UserProfilePage />);
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
  });

  it("404 のとき NotFoundState を出す", () => {
    useUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      isNotFound: true,
      error: new ApiClientError(404, "NOT_FOUND", "対象が見つかりません。"),
      mutate: vi.fn(),
    });
    renderWithProviders(<UserProfilePage />);
    expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();
  });

  it("投稿タブへ切り替えると URL を replace する", () => {
    useUserProfile.mockReturnValue({
      profile: {
        user: { id: 1, userId: "satogames", name: "佐藤" },
        followingCount: 0,
        followerCount: 0,
        isSelf: true,
        isFollowing: false,
        isMuted: false,
      },
      isLoading: false,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    renderWithProviders(<UserProfilePage />);
    expect(screen.getByText("projects-section")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "投稿" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/users/satogames?tab=posts", {
      scroll: false,
    });
  });

  it("tab=posts なら投稿セクションを出す", () => {
    mockSearchParams.set("tab", "posts");
    useUserProfile.mockReturnValue({
      profile: {
        user: { id: 1, userId: "satogames", name: "佐藤" },
        followingCount: 0,
        followerCount: 0,
        isSelf: true,
        isFollowing: false,
        isMuted: false,
      },
      isLoading: false,
      isNotFound: false,
      error: null,
      mutate: vi.fn(),
    });
    renderWithProviders(<UserProfilePage />);
    expect(screen.getByText("posts-section")).toBeInTheDocument();
  });
});
