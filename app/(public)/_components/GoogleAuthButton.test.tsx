// GoogleAuthButton のローディング・開始失敗表示テスト
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signIn = vi.fn();
let isRedirecting = false;
let error: string | null = null;

vi.mock("../_hooks/useGoogleSignIn", () => ({
  useGoogleSignIn: () => ({
    signIn,
    get isRedirecting() {
      return isRedirecting;
    },
    get error() {
      return error;
    },
  }),
}));

import { GoogleAuthButton } from "./GoogleAuthButton";

describe("GoogleAuthButton", () => {
  beforeEach(() => {
    signIn.mockReset();
    isRedirecting = false;
    error = null;
  });

  it("クリックで signIn を呼ぶ", () => {
    renderWithProviders(<GoogleAuthButton label="Googleでログイン" />);
    fireEvent.click(screen.getByRole("button", { name: "Googleでログイン" }));
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it("リダイレクト中はボタンを disabled にする", () => {
    isRedirecting = true;
    renderWithProviders(<GoogleAuthButton label="Googleでログイン" />);
    expect(screen.getByRole("button", { name: "Googleでログイン" })).toBeDisabled();
  });

  it("開始失敗メッセージを alert で出す", () => {
    error = "Google認証を開始できませんでした。時間をおいて再度お試しください。";
    renderWithProviders(<GoogleAuthButton label="Googleで認証する" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Google認証を開始できませんでした。時間をおいて再度お試しください。",
    );
  });
});
