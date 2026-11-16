// GET /api/posts/[postId] の取得と 404 テスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const findUnique = vi.fn();
const listPostStampSummaries = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
}));

vi.mock("@/lib/api/postStamp", () => ({
  listPostStampSummaries: (...args: unknown[]) => listPostStampSummaries(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

describe("GET /api/posts/[postId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPostStampSummaries.mockResolvedValue([]);
  });

  async function get(postId: string) {
    const { GET } = await import("./route");
    return GET(new Request(`http://localhost:3000/api/posts/${postId}`), {
      params: Promise.resolve({ postId }),
    });
  }

  it("不正な postId は 404 を返す", async () => {
    const response = await get("abc");
    expect(response.status).toBe(404);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("存在しない投稿は 404 を返す", async () => {
    getViewer.mockResolvedValue(null);
    findUnique.mockResolvedValue(null);
    const response = await get("999");
    expect(response.status).toBe(404);
  });

  it("著者でログインすると canEdit が true", async () => {
    getViewer.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({
      id: 10,
      body: "本文",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      status: null,
      author: { id: 1, userId: "me", name: "自分" },
      task: null,
      _count: { comments: 0, favorites: 0 },
      favorites: [],
    });
    listPostStampSummaries.mockResolvedValue([
      { emoji: "🎉", count: 2, sentByMe: true },
    ]);

    const response = await get("10");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      post: {
        id: 10,
        body: "本文",
        createdAt: "2026-01-01T00:00:00.000Z",
        author: { id: 1, userId: "me", name: "自分" },
        progress: null,
        commentCount: 0,
        favoriteCount: 0,
        isFavorited: false,
        canEdit: true,
        stamps: [{ emoji: "🎉", count: 2, sentByMe: true }],
      },
    });
  });

  it("未ログインでは canEdit が false", async () => {
    getViewer.mockResolvedValue(null);
    findUnique.mockResolvedValue({
      id: 10,
      body: "本文",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      status: null,
      author: { id: 1, userId: "me", name: "自分" },
      task: null,
      _count: { comments: 0, favorites: 0 },
      favorites: false,
    });

    const response = await get("10");
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.post.canEdit).toBe(false);
    expect(json.post.isFavorited).toBe(false);
  });
});
