// SignupPageContent の step × auth status 表示分岐テスト
import "@/test/mocks/navigation";
import {
  authState,
  createReadyUser,
  mockMutate,
  resetAuthMocks,
  setAuthState,
} from "@/test/mocks/auth";
import { mockSearchParams, resetNavigationMocks, mockRouter } from "@/test/mocks/navigation";
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

import { SignupPageContent } from "./SignupPageContent";

describe("SignupPageContent", () => {
  beforeEach(() => {
    resetAuthMocks();
    resetNavigationMocks();
  });

  it("guest ではステップ1（Google認証）だけを出す", () => {
    setAuthState("guest");
    renderWithProviders(<SignupPageContent />);
    expect(screen.getByRole("heading", { name: "Googleで認証する" })).toBeInTheDocument();
    expect(screen.queryByLabelText("ユーザー名")).not.toBeInTheDocument();
  });

  it("noProfile かつ step=profile ではプロフィールフォームを出す", () => {
    setAuthState("noProfile");
    mockSearchParams.set("step", "profile");
    renderWithProviders(<SignupPageContent />);
    expect(screen.getByRole("heading", { name: "ユーザー情報を登録" })).toBeInTheDocument();
    expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
  });

  it("guest かつ step=profile では /signup へ replace する", async () => {
    setAuthState("guest");
    mockSearchParams.set("step", "profile");
    renderWithProviders(<SignupPageContent />);
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/signup");
    });
  });

  it("ready のときはローディングを出し useGuestOnly が /home へ送る", async () => {
    setAuthState("ready", createReadyUser());
    renderWithProviders(<SignupPageContent />);
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/home");
    });
  });
});
