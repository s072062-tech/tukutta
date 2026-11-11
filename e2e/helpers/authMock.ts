// E2E 向けに /api/user-self など認証関連 API をスタブするヘルパー
import type { Page, Route } from "@playwright/test";

export type MockAuthStatus = "guest" | "noProfile" | "ready";

export type ReadyUser = {
  id: number;
  userId: string;
  name: string;
};

const DEFAULT_READY_USER: ReadyUser = {
  id: 1,
  userId: "satogames",
  name: "佐藤ゲームズ",
};

function userSelfBody(status: MockAuthStatus, user: ReadyUser = DEFAULT_READY_USER) {
  if (status === "ready") {
    return { status: "ready" as const, user };
  }
  if (status === "noProfile") {
    return {
      status: "noProfile" as const,
      user: null,
      email: "user@example.com",
    };
  }
  return { status: "guest" as const, user: null };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function mockUserSelf(
  page: Page,
  status: MockAuthStatus,
  user: ReadyUser = DEFAULT_READY_USER,
) {
  await page.route("**/api/user-self", async (route) => {
    await fulfillJson(route, userSelfBody(status, user));
  });
}

/** ページ遷移は domcontentloaded で打ち切り（dev の初回コンパイル待ちで load が長引くため） */
export async function gotoApp(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

export type ProfileStub = {
  userId: string;
  name: string;
  id?: number;
  isSelf?: boolean;
  isFollowing?: boolean;
  isMuted?: boolean;
  followingCount?: number;
  followerCount?: number;
};

export async function mockUserProfile(page: Page, profile: ProfileStub) {
  const id = profile.id ?? 2;
  await page.route(`**/api/users/${profile.userId}`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await fulfillJson(route, {
      user: { id, userId: profile.userId, name: profile.name },
      followingCount: profile.followingCount ?? 0,
      followerCount: profile.followerCount ?? 3,
      isSelf: profile.isSelf ?? false,
      isFollowing: profile.isFollowing ?? false,
      isMuted: profile.isMuted ?? false,
    });
  });
}

export async function mockUserProjects(page: Page, userId: string, items: unknown[] = []) {
  await page.route(`**/api/users/${userId}/projects`, async (route) => {
    await fulfillJson(route, items);
  });
}

export async function mockUserPosts(
  page: Page,
  userId: string,
  items: unknown[] = [],
) {
  await page.route(`**/api/users/${userId}/posts**`, async (route) => {
    await fulfillJson(route, { items, nextCursor: null });
  });
}

export async function mockNotFoundUser(page: Page, userId: string) {
  await page.route(`**/api/users/${userId}`, async (route) => {
    await fulfillJson(
      route,
      {
        error: {
          code: "NOT_FOUND",
          message: "対象が見つかりません。",
        },
      },
      404,
    );
  });
}
