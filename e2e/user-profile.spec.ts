// ユーザー情報画面の擬似ログイン E2E
import { expect, test, type Page } from "@playwright/test";
import {
  gotoApp,
  mockNotFoundUser,
  mockUserPosts,
  mockUserProfile,
  mockUserProjects,
  mockUserSelf,
} from "./helpers/authMock";

async function stubOtherProfile(page: Page) {
  await mockUserSelf(page, "ready");
  await mockUserProfile(page, {
    userId: "otheruser",
    name: "他ユーザー",
    isSelf: false,
    followerCount: 3,
  });
  await mockUserProjects(page, "otheruser", []);
  await mockUserPosts(page, "otheruser", []);
}

async function stubSelfProfile(page: Page) {
  await mockUserSelf(page, "ready", {
    id: 1,
    userId: "satogames",
    name: "佐藤ゲームズ",
  });
  await mockUserProfile(page, {
    userId: "satogames",
    name: "佐藤ゲームズ",
    id: 1,
    isSelf: true,
  });
  await mockUserProjects(page, "satogames", []);
  await mockUserPosts(page, "satogames", []);
}

test.describe("user-profile", () => {
  test("存在しないユーザーは NotFound を出す", async ({ page }) => {
    await mockUserSelf(page, "guest");
    await mockNotFoundUser(page, "nobody");
    await gotoApp(page, "/users/nobody");
    await expect(page.getByText("ページが見つかりません")).toBeVisible();
  });

  test("自分のページでは Follow/Mute がなく登録フォームがある", async ({ page }) => {
    await stubSelfProfile(page);
    await gotoApp(page, "/users/satogames");
    await expect(page.getByRole("heading", { name: "佐藤ゲームズ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "フォロー" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "ミュート" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "プロジェクトを登録" })).toBeVisible();
  });

  test("他人のページでは Follow/Mute がある", async ({ page }) => {
    await stubOtherProfile(page);
    await gotoApp(page, "/users/otheruser");
    await expect(page.getByRole("button", { name: "フォロー" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ミュート" })).toBeVisible();
  });

  test("guest でフォローを押すと /login へ送る", async ({ page }) => {
    await mockUserSelf(page, "guest");
    await mockUserProfile(page, {
      userId: "otheruser",
      name: "他ユーザー",
      isSelf: false,
    });
    await mockUserProjects(page, "otheruser", []);
    await mockUserPosts(page, "otheruser", []);
    await gotoApp(page, "/users/otheruser");
    await page.getByRole("button", { name: "フォロー" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("プロジェクト名空送信では POST しない", async ({ page }) => {
    await stubSelfProfile(page);
    let projectPostCount = 0;
    await page.route("**/api/projects", async (route) => {
      if (route.request().method() === "POST") {
        projectPostCount += 1;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ project: { id: 1 } }),
      });
    });
    await gotoApp(page, "/users/satogames");
    await page.getByRole("button", { name: "登録する" }).click();
    await expect(page.getByText("プロジェクト名を入力してください。")).toBeVisible();
    expect(projectPostCount).toBe(0);
  });

  test("フォロー成功でフォロワー数が更新される", async ({ page }) => {
    await stubOtherProfile(page);
    await page.route("**/api/users/otheruser/follow", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isFollowing: true, followerCount: 4 }),
      });
    });
    await gotoApp(page, "/users/otheruser");
    await page.getByRole("button", { name: "フォロー" }).click();
    await expect(page.getByRole("button", { name: "フォロー中" })).toBeVisible();
    await expect(page.getByRole("link", { name: /フォロワー/ })).toContainText("4");
  });
});
