// FavoriteButton のログインガードと失敗時ロールバックテスト
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
    apiDelete: vi.fn(),
  };
});

import { FavoriteButton } from "./FavoriteButton";

describe("FavoriteButton", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
    apiPost.mockReset();
  });

  it("guest のクリックで /login へ送る", () => {
    setAuthState("guest");
    renderWithProviders(<FavoriteButton postId={1} isFavorited={false} />);
    fireEvent.click(screen.getByRole("button", { name: "お気に入り" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("noProfile のクリックで signup step=profile へ送る", () => {
    setAuthState("noProfile");
    renderWithProviders(<FavoriteButton postId={1} isFavorited={false} />);
    fireEvent.click(screen.getByRole("button", { name: "お気に入り" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/signup?step=profile");
  });

  it("通信失敗時はハートを戻しエラーを出す", async () => {
    setAuthState("ready", createReadyUser());
    apiPost.mockRejectedValue(new ApiClientError(500, "INTERNAL_ERROR", "error"));
    renderWithProviders(<FavoriteButton postId={1} isFavorited={false} />);
    fireEvent.click(screen.getByRole("button", { name: "お気に入り" }));
    expect(await screen.findByText("お気に入りを更新できませんでした。")).toBeInTheDocument();
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalled();
    });
  });
});
