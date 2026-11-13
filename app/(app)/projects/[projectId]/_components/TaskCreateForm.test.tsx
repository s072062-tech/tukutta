// タスク登録フォームのクライアント検証テスト
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
import { TaskCreateForm } from "./TaskCreateForm";

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({ ...authState, mutate: mockMutate }),
}));

describe("TaskCreateForm", () => {
  beforeEach(() => {
    resetNavigationMocks();
    resetAuthMocks();
    setAuthState("ready", createReadyUser());
  });

  it("空の名前で送信するとエラーを出す", async () => {
    renderWithProviders(
      <TaskCreateForm projectId={10} onCreated={async () => undefined} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));
    await waitFor(() => {
      expect(screen.getByText("タスク名を入力してください。")).toBeInTheDocument();
    });
  });

  it("初期ステータスは未着手", () => {
    renderWithProviders(
      <TaskCreateForm projectId={10} onCreated={async () => undefined} />,
    );
    expect(screen.getByLabelText("初期ステータス")).toHaveValue("未着手");
  });
});
