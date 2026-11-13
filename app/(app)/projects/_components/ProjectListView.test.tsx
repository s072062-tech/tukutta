// ProjectListView の空文言・ゲストのフォロー誘導・検索 URL テスト
import "@/test/mocks/navigation";
import {
  authState,
  createReadyUser,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { mockRouter, mockSearchParams, resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { ProjectCard } from "@/types/project";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useProjectList = vi.fn();

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({ ...authState, mutate: mockMutate }),
}));

vi.mock("../_hooks/useProjectList", () => ({
  useProjectList: (...args: unknown[]) => useProjectList(...args),
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

import { ProjectListView } from "./ProjectListView";

const sampleProject: ProjectCard = {
  id: 1,
  name: "カピバラ農業",
  description: "農場経営",
  owner: { id: 2, userId: "owner", name: "オーナー" },
  taskCounts: { total: 3, 未着手: 1, 進行中: 1, 完了: 1 },
};

function mockList(overrides?: Partial<ReturnType<typeof defaultList>>) {
  useProjectList.mockReturnValue({ ...defaultList(), ...overrides });
}

function defaultList() {
  return {
    projects: [] as ProjectCard[],
    total: 0,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
    error: undefined,
    mutate: vi.fn(),
  };
}

describe("ProjectListView", () => {
  beforeEach(() => {
    resetNavigationMocks();
    resetAuthMocks();
    useProjectList.mockReset();
    setAuthState("ready", createReadyUser());
    mockList();
  });

  it("全ユーザーで0件なら専用の空文言を出す", () => {
    renderWithProviders(<ProjectListView />);
    expect(screen.getByText("まだプロジェクトがありません")).toBeInTheDocument();
  });

  it("検索結果0件なら該当なし文言を出す", () => {
    mockSearchParams.set("q", "ない");
    mockList({ total: 0, projects: [] });
    renderWithProviders(<ProjectListView />);
    expect(screen.getByText("該当するプロジェクトがありません")).toBeInTheDocument();
  });

  it("フォロータブで0件なら専用の空文言を出す", () => {
    mockSearchParams.set("tab", "following");
    mockList({ total: 0, projects: [] });
    renderWithProviders(<ProjectListView />);
    expect(screen.getByText("フォロー中のプロジェクトはありません")).toBeInTheDocument();
  });

  it("件数とカードを表示する", () => {
    mockList({ total: 1, projects: [sampleProject] });
    renderWithProviders(<ProjectListView />);
    expect(screen.getByText("1件のプロジェクト")).toBeInTheDocument();
    expect(screen.getByText("カピバラ農業")).toBeInTheDocument();
  });

  it("guest がフォロータブを押すと /login へ replace する", () => {
    setAuthState("guest", null);
    mockList({ total: 1, projects: [sampleProject] });
    renderWithProviders(<ProjectListView />);
    fireEvent.click(screen.getByRole("tab", { name: "フォロー" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/login");
    expect(mockRouter.replace).not.toHaveBeenCalledWith(
      expect.stringContaining("tab=following"),
      expect.anything(),
    );
  });

  it("Enter 検索で q を URL に載せる", () => {
    mockList({ total: 1, projects: [sampleProject] });
    renderWithProviders(<ProjectListView />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "カピ" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockRouter.replace).toHaveBeenCalledWith("/projects?q=%E3%82%AB%E3%83%94", {
      scroll: false,
    });
  });
});
