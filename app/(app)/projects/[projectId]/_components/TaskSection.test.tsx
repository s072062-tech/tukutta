// タスク一覧のオーナー分岐・空状態テスト
import "@/test/mocks/navigation";
import {
  createReadyUser,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { GetProjectResponse } from "@/app/api/projects/[projectId]/route";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskSection } from "./TaskSection";

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({ status: "ready", me: createReadyUser(), mutate: mockMutate }),
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

const tasks: GetProjectResponse["tasks"] = [
  { id: 1, name: "マップ", status: "未着手" },
  { id: 2, name: "UI", status: "進行中" },
];

describe("TaskSection", () => {
  beforeEach(() => {
    resetAuthMocks();
    setAuthState("ready", createReadyUser());
  });

  it("オーナーなら登録フォームと編集リンクを出す", () => {
    renderWithProviders(
      <TaskSection projectId="10" tasks={tasks} isOwner onCreated={async () => undefined} />,
    );
    expect(screen.getByRole("heading", { name: "タスクを登録" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /編集/ })).toHaveLength(2);
    expect(screen.getByText("タスク 2")).toBeInTheDocument();
  });

  it("オーナー以外はフォームと編集リンクを出さない", () => {
    renderWithProviders(
      <TaskSection
        projectId="10"
        tasks={tasks}
        isOwner={false}
        onCreated={async () => undefined}
      />,
    );
    expect(screen.queryByRole("heading", { name: "タスクを登録" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /編集/ })).not.toBeInTheDocument();
  });

  it("0件なら空文言と注記を出す", () => {
    renderWithProviders(
      <TaskSection projectId="10" tasks={[]} isOwner={false} onCreated={async () => undefined} />,
    );
    expect(screen.getByText("まだタスクがありません")).toBeInTheDocument();
    expect(screen.getByText("ステータスは進捗投稿から更新できます")).toBeInTheDocument();
  });
});
