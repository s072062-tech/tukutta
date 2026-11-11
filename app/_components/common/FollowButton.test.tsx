// FollowButton のログインガードと失敗時ロールバックテスト
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
import { ApiClientError } from "@/lib/apiClient";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiPost = vi.fn();
const apiDelete = vi.fn();

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({
    status: authState.status,
    me: authState.me,
    mutate: mockMutate,
  }),
}));

vi.mock("@/lib/apiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/apiClient")>("@/lib/apiClient");
  return {
    ...actual,
    apiPost: (...args: unknown[]) => apiPost(...args),
    apiDelete: (...args: unknown[]) => apiDelete(...args),
  };
});

import { FollowButton } from "./FollowButton";

describe("FollowButton", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
    apiPost.mockReset();
    apiDelete.mockReset();
  });

  it("guest のクリックで /login へ送る", () => {
    setAuthState("guest");
    renderWithProviders(<FollowButton userId="other" isFollowing={false} />);
    fireEvent.click(screen.getByRole("button", { name: "フォロー" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("noProfile のクリックで signup step=profile へ送る", () => {
    setAuthState("noProfile");
    renderWithProviders(<FollowButton userId="other" isFollowing={false} />);
    fireEvent.click(screen.getByRole("button", { name: "フォロー" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/signup?step=profile");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("通信失敗時は表示を戻しエラーを出す", async () => {
    setAuthState("ready", createReadyUser());
    apiPost.mockRejectedValue(new ApiClientError(500, "INTERNAL_ERROR", "error"));
    renderWithProviders(<FollowButton userId="other" isFollowing={false} />);
    fireEvent.click(screen.getByRole("button", { name: "フォロー" }));
    expect(await screen.findByText("フォローを更新できませんでした。")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "フォロー" })).toBeInTheDocument();
    });
  });
});
