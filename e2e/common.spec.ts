// 共通の認証ガードと callback エラー経路の E2E
import { expect, test } from "@playwright/test";
import { gotoApp, mockUserSelf } from "./helpers/authMock";

test.describe("共通認証ガード", () => {
  test("ready 擬似で /signup と /login は /home へ送る", async ({ page }) => {
    await mockUserSelf(page, "ready");
    await gotoApp(page, "/signup");
    await expect(page).toHaveURL(/\/home$/);
    await gotoApp(page, "/login");
    await expect(page).toHaveURL(/\/home$/);
  });

  test("code なしの /auth/callback は /login?error=auth へ送る", async ({ page }) => {
    await gotoApp(page, "/auth/callback");
    await expect(page).toHaveURL(/\/login\?error=auth$/);
  });
});
