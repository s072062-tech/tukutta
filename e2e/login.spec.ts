// ログイン画面の公開経路 E2E
import { expect, test } from "@playwright/test";
import { gotoApp, mockUserSelf } from "./helpers/authMock";

test.describe("login", () => {
  test("guest でログインカードを出す", async ({ page }) => {
    await mockUserSelf(page, "guest");
    await gotoApp(page, "/login");
    await expect(page.getByRole("heading", { name: "Googleでログイン" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });

  test("error=auth のとき失敗文言を出す", async ({ page }) => {
    await mockUserSelf(page, "guest");
    await gotoApp(page, "/login?error=auth");
    await expect(
      page.getByText("Google認証に失敗しました。もう一度お試しください。"),
    ).toBeVisible();
  });

  test("error が auth 以外なら失敗文言を出さない", async ({ page }) => {
    await mockUserSelf(page, "guest");
    await gotoApp(page, "/login?error=other");
    await expect(
      page.getByText("Google認証に失敗しました。もう一度お試しください。"),
    ).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Googleでログイン" })).toBeVisible();
  });
});
