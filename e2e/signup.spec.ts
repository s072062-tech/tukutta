// ユーザー登録画面の公開経路 E2E
import { expect, test } from "@playwright/test";
import { gotoApp, mockUserSelf } from "./helpers/authMock";

test.describe("signup", () => {
  test("guest で /signup を開くとステップ1だけが出る", async ({ page }) => {
    await mockUserSelf(page, "guest");
    await gotoApp(page, "/signup");
    await expect(page.getByRole("heading", { name: "Googleで認証する" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Googleで認証する" })).toBeVisible();
    await expect(page.getByLabel("ユーザー名")).toHaveCount(0);
  });

  test("guest で /signup?step=profile を開くとステップ1へ戻る", async ({ page }) => {
    await mockUserSelf(page, "guest");
    await gotoApp(page, "/signup?step=profile");
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: "Googleで認証する" })).toBeVisible();
  });

  test("noProfile で step=profile ならプロフィールフォームが出る", async ({ page }) => {
    await mockUserSelf(page, "noProfile");
    await gotoApp(page, "/signup?step=profile");
    await expect(page.getByRole("heading", { name: "ユーザー情報を登録" })).toBeVisible();
    await expect(page.getByLabel("ユーザー名")).toBeVisible();
    await expect(page.getByLabel("ユーザーID")).toBeVisible();
  });
});
