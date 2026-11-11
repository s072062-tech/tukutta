// ProjectForm のクライアント検証と二重送信防止テスト
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
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({
    status: authState.status,
    me: authState.me,
    mutate: mockMutate,
  }),
}));

import { ProjectForm } from "./ProjectForm";

describe("ProjectForm", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
    setAuthState("ready", createReadyUser());
  });

  it("名前が空ならエラーを出し onSubmit を呼ばない", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ProjectForm submitLabel="登録する" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));
    expect(await screen.findByText("プロジェクト名を入力してください。")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("送信中はボタンを disabled にして二重送信を防ぐ", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    renderWithProviders(<ProjectForm submitLabel="登録する" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("プロジェクト名"), {
      target: { value: "新作RPG" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "登録する" })).toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    resolveSubmit?.();
  });
});
