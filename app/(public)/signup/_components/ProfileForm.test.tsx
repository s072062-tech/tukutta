// ProfileForm のクライアント検証・APIエラー表示テスト
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
  };
});

import { ProfileForm } from "./ProfileForm";

describe("ProfileForm", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
    setAuthState("noProfile");
    apiPost.mockReset();
  });

  it("空送信で必須エラーを出し API を呼ばない", async () => {
    renderWithProviders(<ProfileForm />);
    fireEvent.click(screen.getByRole("button", { name: "登録を完了する" }));
    expect(await screen.findByText("ユーザー名を入力してください。")).toBeInTheDocument();
    expect(screen.getByText("ユーザーIDを入力してください。")).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("userId 重複の 409 をフィールドエラーに出す", async () => {
    apiPost.mockRejectedValue(
      new ApiClientError(409, "CONFLICT", "このユーザーIDは使われています。", {
        userId: ["このユーザーIDは使われています。"],
      }),
    );
    renderWithProviders(<ProfileForm />);
    fireEvent.change(screen.getByLabelText("ユーザー名"), {
      target: { value: "佐藤ゲームズ" },
    });
    fireEvent.change(screen.getByLabelText("ユーザーID"), {
      target: { value: "satogames" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登録を完了する" }));
    expect(await screen.findByText("このユーザーIDは使われています。")).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("登録成功で mutate と /home へ replace する", async () => {
    apiPost.mockResolvedValue({
      user: { id: 1, userId: "satogames", name: "佐藤ゲームズ" },
    });
    renderWithProviders(<ProfileForm />);
    fireEvent.change(screen.getByLabelText("ユーザー名"), {
      target: { value: "佐藤ゲームズ" },
    });
    fireEvent.change(screen.getByLabelText("ユーザーID"), {
      target: { value: "satogames" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登録を完了する" }));
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith("/api/users", {
        name: "佐藤ゲームズ",
        userId: "satogames",
      });
      expect(mockMutate).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/home");
    });
  });
});
