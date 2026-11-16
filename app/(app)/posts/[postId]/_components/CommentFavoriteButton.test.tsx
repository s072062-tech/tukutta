// CommentFavoriteButton のログインガードと失敗時ロールバックテスト
import "@/test/mocks/navigation";
import {
  authState,
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

import { CommentFavoriteButton } from "./CommentFavoriteButton";

describe("CommentFavoriteButton", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
    apiPost.mockReset();
    apiDelete.mockReset();
  });

  it("guest のクリックで /login へ送る", () => {
    setAuthState("guest");
    renderWithProviders(
      <CommentFavoriteButton commentId={1} isFavorited={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "お気に入り" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("失敗時は見た目を戻しエラー文言を出す", async () => {
    setAuthState("ready", { id: 1, userId: "me", name: "自分" });
    apiPost.mockRejectedValue(
      new ApiClientError(500, "INTERNAL_ERROR", "失敗"),
    );
    renderWithProviders(
      <CommentFavoriteButton commentId={1} isFavorited={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "お気に入り" }));
    await waitFor(() => {
      expect(
        screen.getByText("お気に入りを更新できませんでした。"),
      ).toBeInTheDocument();
    });
  });
});
