// GET /api/users/[userId]/posts の不正 cursor テスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const getUserIdByHandle = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
}));

vi.mock("@/lib/api/user", () => ({
  getUserIdByHandle: (...args: unknown[]) => getUserIdByHandle(...args),
}));

vi.mock("@/lib/api/postCard", () => ({
  postCardSelect: () => ({}),
  toPostCard: (row: unknown) => row,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

describe("GET /api/users/[userId]/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewer.mockResolvedValue(null);
    getUserIdByHandle.mockResolvedValue(2);
  });

  async function get(cursor?: string) {
    const { GET } = await import("./route");
    const url =
      cursor === undefined
        ? "http://localhost:3000/api/users/satogames/posts"
        : `http://localhost:3000/api/users/satogames/posts?cursor=${cursor}`;
    return GET(new Request(url), {
      params: Promise.resolve({ userId: "satogames" }),
    });
  }

  it("不正な cursor は 422 を返す", async () => {
    const response = await get("abc");
    expect(response.status).toBe(422);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("cursor なしなら一覧を返す", async () => {
    findMany.mockResolvedValue([]);
    const response = await get();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], nextCursor: null });
  });
});
