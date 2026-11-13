// ヘッダーのオーナー分岐テスト
import "@/test/mocks/navigation";
import {
  createReadyUser,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { GetProjectResponse } from "@/app/api/projects/[projectId]/route";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectHeader } from "./ProjectHeader";

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

vi.mock("@emoji-mart/react", () => ({
  default: () => null,
}));

vi.mock("@emoji-mart/data", () => ({
  default: {},
}));

function makeDetail(overrides?: Partial<GetProjectResponse>): GetProjectResponse {
  return {
    project: { id: 10, name: "カピバラ農業", description: "農場" },
    owner: { id: 1, userId: "satogames", name: "佐藤ゲームズ" },
    isOwner: false,
    isFollowing: false,
    stamps: [],
    tasks: [],
    ...overrides,
  };
}

describe("ProjectHeader", () => {
  beforeEach(() => {
    resetNavigationMocks();
    resetAuthMocks();
    setAuthState("ready", createReadyUser());
  });

  it("オーナーなら編集リンクを出しフォローは出さない", () => {
    renderWithProviders(
      <ProjectHeader
        projectId={10}
        detail={makeDetail({ isOwner: true })}
        onFollowChange={vi.fn()}
        onSendStamp={async () => undefined}
        stampDisabled={false}
      />,
    );
    expect(screen.getByRole("link", { name: /編集/ })).toHaveAttribute(
      "href",
      "/projects/10/edit",
    );
    expect(screen.queryByRole("button", { name: "フォロー" })).not.toBeInTheDocument();
  });

  it("オーナー以外はフォローボタンを出す", () => {
    renderWithProviders(
      <ProjectHeader
        projectId={10}
        detail={makeDetail({ isOwner: false })}
        onFollowChange={vi.fn()}
        onSendStamp={async () => undefined}
        stampDisabled={false}
      />,
    );
    expect(screen.getByRole("button", { name: "フォロー" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /編集/ })).not.toBeInTheDocument();
  });
});
