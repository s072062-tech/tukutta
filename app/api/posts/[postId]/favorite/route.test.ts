// POST /api/posts/[postId]/favorite の upsert と不正 ID テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findUnique = vi.fn();
const upsert = vi.fn();
const count = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    postFavorite: {
      upsert: (...args: unknown[]) => upsert(...args),
      count: (...args: unknown[]) => count(...args),
      deleteMany: vi.fn(),
    },
  },
}));

describe("POST /api/posts/[postId]/favorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(postId: string) {
    const { POST } = await import("./route");
    return POST(new Request(`http://localhost:3000/api/posts/${postId}/favorite`), {
      params: Promise.resolve({ postId }),
    });
  }

  it("未ログインなら 401 を返す", async () => {
    requireUser.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "ログインしてください。"));
    const response = await post("1");
    expect(response.status).toBe(401);
  });

  it("不正な postId は 404 を返す", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    const response = await post("abc");
    expect(response.status).toBe(404);
  });

  it("二重追加でも upsert で1行相当として扱われる", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({ id: 10 });
    upsert.mockResolvedValue({});
    count.mockResolvedValue(1);

    const first = await post("10");
    const second = await post("10");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledWith({
      where: { userId_postId: { userId: 1, postId: 10 } },
      create: { userId: 1, postId: 10 },
      update: {},
    });
    await expect(second.json()).resolves.toEqual({
      isFavorited: true,
      favoriteCount: 1,
    });
  });
});
