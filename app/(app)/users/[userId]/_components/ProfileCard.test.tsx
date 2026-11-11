// ProfileCard の isSelf による Follow/Mute 表示分岐テスト
import "@/test/mocks/navigation";
import {
  authState,
  createReadyUser,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { GetUserResponse } from "@/app/api/users/[userId]/route";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({
    status: authState.status,
    me: authState.me,
    mutate: mockMutate,
  }),
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

import { ProfileCard } from "./ProfileCard";

function profile(overrides?: Partial<GetUserResponse>): GetUserResponse {
  return {
    user: { id: 2, userId: "other", name: "他ユーザー" },
    followingCount: 1,
    followerCount: 3,
    isSelf: false,
    isFollowing: false,
    isMuted: false,
    ...overrides,
  };
}

describe("ProfileCard", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
    setAuthState("ready", createReadyUser());
  });

  it("自分のページでは Follow/Mute を出さない", () => {
    renderWithProviders(
      <ProfileCard
        profile={profile({ isSelf: true, user: { id: 1, userId: "satogames", name: "佐藤" } })}
        onFollowChange={vi.fn()}
        onMuteChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "フォロー" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ミュート" })).not.toBeInTheDocument();
  });

  it("他人のページでは Follow/Mute を出す", () => {
    renderWithProviders(
      <ProfileCard
        profile={profile()}
        onFollowChange={vi.fn()}
        onMuteChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "フォロー" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ミュート" })).toBeInTheDocument();
  });

  it("フォロー／フォロワーリンクの URL を出す", () => {
    renderWithProviders(
      <ProfileCard profile={profile()} onFollowChange={vi.fn()} onMuteChange={vi.fn()} />,
    );
    expect(screen.getByRole("link", { name: /フォロー/ })).toHaveAttribute(
      "href",
      "/users/other/follows?type=following",
    );
    expect(screen.getByRole("link", { name: /フォロワー/ })).toHaveAttribute(
      "href",
      "/users/other/follows?type=followers",
    );
  });
});
