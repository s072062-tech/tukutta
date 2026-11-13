// プロジェクトフォローのゲスト誘導テスト
import "@/test/mocks/navigation";
import {
  authState,
  createReadyUser,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { mockRouter, resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectFollowButton } from "./ProjectFollowButton";

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({ ...authState, mutate: mockMutate }),
}));

describe("ProjectFollowButton", () => {
  beforeEach(() => {
    resetNavigationMocks();
    resetAuthMocks();
  });

  it("ゲストがフォローを押すと login へ進む", () => {
    setAuthState("guest", null);
    renderWithProviders(
      <ProjectFollowButton projectId={10} isFollowing={false} onChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "フォロー" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
  });

  it("フォロー中なら文言がフォロー中になる", () => {
    setAuthState("ready", createReadyUser());
    renderWithProviders(
      <ProjectFollowButton projectId={10} isFollowing onChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "フォロー中" })).toBeInTheDocument();
  });
});
