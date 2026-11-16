// コメントお気に入りの upsert / deleteMany テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findUnique = vi.fn();
const upsert = vi.fn();
const count = vi.fn();
const deleteMany = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    postComment: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    postCommentFavorite: {
      upsert: (...args: unknown[]) => upsert(...args),
      count: (...args: unknown[]) => count(...args),
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

describe("/api/comments/[commentId]/favorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({ id: 7 });
  });

  async function post(commentId: string) {
    const { POST } = await import("./route");
    return POST(
      new Request(`http://localhost:3000/api/comments/${commentId}/favorite`),
      { params: Promise.resolve({ commentId }) },
    );
  }

  async function del(commentId: string) {
    const { DELETE } = await import("./route");
    return DELETE(
      new Request(`http://localhost:3000/api/comments/${commentId}/favorite`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ commentId }) },
    );
  }

  it("POST を2回しても favoriteCount は count 結果どおり", async () => {
    upsert.mockResolvedValue({});
    count.mockResolvedValue(1);
    const first = await post("7");
    const second = await post("7");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({
      isFavorited: true,
      favoriteCount: 1,
    });
  });

  it("DELETE で isFavorited false", async () => {
    deleteMany.mockResolvedValue({ count: 1 });
    count.mockResolvedValue(0);
    const response = await del("7");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      isFavorited: false,
      favoriteCount: 0,
    });
  });

  it("未ログインは 401", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await post("7");
    expect(response.status).toBe(401);
  });

  it("無いコメントは 404", async () => {
    findUnique.mockResolvedValue(null);
    const response = await post("999");
    expect(response.status).toBe(404);
  });
});
