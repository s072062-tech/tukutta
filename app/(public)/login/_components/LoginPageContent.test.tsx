// LoginPageContent の error=auth 表示とゲスト専用分岐テスト
import "@/test/mocks/navigation";
import {
  authState,
  createReadyUser,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { mockSearchParams, mockRouter, resetNavigationMocks } from "@/test/mocks/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/_hooks/useAuth", () => ({
  useAuth: () => ({
    status: authState.status,
    me: authState.me,
    mutate: mockMutate,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
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

import { LoginPageContent } from "./LoginPageContent";

describe("LoginPageContent", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
  });

  it("guest でログインカードを出す", () => {
    setAuthState("guest");
    renderWithProviders(<LoginPageContent />);
    expect(screen.getByRole("heading", { name: "Googleでログイン" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Googleでログイン" })).toBeInTheDocument();
  });

  it("error=auth のとき失敗文言を出す", () => {
    setAuthState("guest");
    mockSearchParams.set("error", "auth");
    renderWithProviders(<LoginPageContent />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Google認証に失敗しました。もう一度お試しください。",
    );
  });

  it("error が auth 以外なら失敗文言を出さない", () => {
    setAuthState("guest");
    mockSearchParams.set("error", "other");
    renderWithProviders(<LoginPageContent />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ready のときはローディングを出し /home へ送る", async () => {
    setAuthState("ready", createReadyUser());
    renderWithProviders(<LoginPageContent />);
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/home");
    });
  });
});
