// MuteButton のログインガードテスト
import "@/test/mocks/navigation";
import {
  authState,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { mockRouter, resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
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

import { MuteButton } from "./MuteButton";

describe("MuteButton", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
    apiPost.mockReset();
  });

  it("guest のクリックで /login へ送る", () => {
    setAuthState("guest");
    renderWithProviders(<MuteButton userId="other" isMuted={false} />);
    fireEvent.click(screen.getByRole("button", { name: "ミュート" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
    expect(apiPost).not.toHaveBeenCalled();
  });
});
