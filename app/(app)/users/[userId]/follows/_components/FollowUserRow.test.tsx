// FollowUserRow の遷移と FollowButton 表示テスト
import "@/test/mocks/navigation";
import { mockRouter, resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { FollowListItem } from "@/app/api/users/[userId]/follows/route";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowUserRow } from "./FollowUserRow";

vi.mock("@/app/_components/common/FollowButton", () => ({
  FollowButton: ({ userId }: { userId: string }) => (
    <button type="button">follow-{userId}</button>
  ),
}));

const otherUser: FollowListItem = {
  id: 2,
  userId: "bob",
  name: "Bob",
  isFollowing: false,
  isSelf: false,
};

const selfUser: FollowListItem = {
  id: 1,
  userId: "alice",
  name: "Alice",
  isFollowing: false,
  isSelf: true,
};

describe("FollowUserRow", () => {
  beforeEach(() => {
    resetNavigationMocks();
  });

  it("行クリックでユーザー情報へ遷移する", () => {
    renderWithProviders(
      <FollowUserRow user={otherUser} onFollowChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("link", { name: "Bob @bob" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/users/bob");
  });

  it("自分の行にはフォローボタンを出さない", () => {
    renderWithProviders(
      <FollowUserRow user={selfUser} onFollowChange={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /follow-/ })).not.toBeInTheDocument();
  });

  it("他人の行にはフォローボタンを出す", () => {
    renderWithProviders(
      <FollowUserRow user={otherUser} onFollowChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "follow-bob" })).toBeInTheDocument();
  });

  it("フォローボタンのクリックでは行の遷移を起こさない", () => {
    renderWithProviders(
      <FollowUserRow user={otherUser} onFollowChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "follow-bob" }));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
