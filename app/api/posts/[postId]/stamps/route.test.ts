// 投稿スタンプの 201 / 409 / 422 テスト
import { Prisma } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();
const listPostStampSummaries = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/api/postStamp", () => ({
  listPostStampSummaries: (...args: unknown[]) => listPostStampSummaries(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    postStamp: {
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

describe("POST /api/posts/[postId]/stamps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({ id: 10 });
    listPostStampSummaries.mockResolvedValue([
      { emoji: "🎉", count: 1, sentByMe: true },
    ]);
  });

  async function post(postId: string, body: unknown) {
    const { POST } = await import("./route");
    return POST(
      new Request(`http://localhost:3000/api/posts/${postId}/stamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ postId }) },
    );
  }

  it("未ログインなら 401 を返す", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await post("10", { emoji: "🎉" });
    expect(response.status).toBe(401);
  });

  it("スタンプ送信に成功すると 201 を返す", async () => {
    create.mockResolvedValue({});
    const response = await post("10", { emoji: "🎉" });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual([
      { emoji: "🎉", count: 1, sentByMe: true },
    ]);
  });

  it("同じ絵文字の重ね送りは 409 を返す", async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const response = await post("10", { emoji: "🎉" });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: "このスタンプは送信済みです。" },
    });
  });

  it("空の emoji は 422 を返す", async () => {
    const response = await post("10", { emoji: "" });
    expect(response.status).toBe(422);
  });
});
