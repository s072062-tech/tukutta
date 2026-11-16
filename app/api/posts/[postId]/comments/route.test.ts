// コメント GET / POST の主要ケーステスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const requireUser = vi.fn();
const postFindUnique = vi.fn();
const commentFindMany = vi.fn();
const commentFindUnique = vi.fn();
const commentCreate = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: (...args: unknown[]) => postFindUnique(...args),
    },
    postComment: {
      findMany: (...args: unknown[]) => commentFindMany(...args),
      findUnique: (...args: unknown[]) => commentFindUnique(...args),
      create: (...args: unknown[]) => commentCreate(...args),
    },
  },
}));

describe("/api/posts/[postId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postFindUnique.mockResolvedValue({ id: 10 });
  });

  async function get(postId: string) {
    const { GET } = await import("./route");
    return GET(new Request(`http://localhost:3000/api/posts/${postId}/comments`), {
      params: Promise.resolve({ postId }),
    });
  }

  async function post(postId: string, body: unknown) {
    const { POST } = await import("./route");
    return POST(
      new Request(`http://localhost:3000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ postId }) },
    );
  }

  it("投稿が無い id は GET で 404", async () => {
    postFindUnique.mockResolvedValue(null);
    const response = await get("999");
    expect(response.status).toBe(404);
  });

  it("コメント0件は空配列", async () => {
    getViewer.mockResolvedValue(null);
    commentFindMany.mockResolvedValue([]);
    const response = await get("10");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ comments: [] });
  });

  it("本文だけの POST が 201", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    commentCreate.mockResolvedValue({
      id: 5,
      body: "フィードバック",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      author: { id: 1, userId: "me", name: "自分" },
    });

    const response = await post("10", { body: "フィードバック" });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      comment: {
        id: 5,
        body: "フィードバック",
        createdAt: "2026-01-01T00:00:00.000Z",
        author: { id: 1, userId: "me", name: "自分" },
        isFavorited: false,
        favoriteCount: 0,
        canDelete: true,
        replies: [],
      },
    });
  });

  it("別投稿の parentCommentId は 422", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    commentFindUnique.mockResolvedValue({ id: 3, postId: 99 });

    const response = await post("10", { body: "返信", parentCommentId: 3 });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        message: "返信先がこの投稿のコメントではありません。",
        fieldErrors: {
          parentCommentId: ["返信先がこの投稿のコメントではありません。"],
        },
      },
    });
  });

  it("未ログインの POST は 401", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await post("10", { body: "x" });
    expect(response.status).toBe(401);
  });
});
