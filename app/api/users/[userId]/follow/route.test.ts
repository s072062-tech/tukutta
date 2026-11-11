// POST /api/users/[userId]/follow の権限・自己フォロー拒否テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getUserIdByHandle = vi.fn();
const upsert = vi.fn();
const count = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/api/user", () => ({
  getUserIdByHandle: (...args: unknown[]) => getUserIdByHandle(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userFollow: {
      upsert: (...args: unknown[]) => upsert(...args),
      count: (...args: unknown[]) => count(...args),
      deleteMany: vi.fn(),
    },
  },
}));

describe("POST /api/users/[userId]/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(handle: string) {
    const { POST } = await import("./route");
    return POST(new Request("http://localhost:3000/api/users/x/follow"), {
      params: Promise.resolve({ userId: handle }),
    });
  }

  it("未ログインなら 401 を返す", async () => {
    requireUser.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "ログインしてください。"));
    const response = await post("other");
    expect(response.status).toBe(401);
  });

  it("自分自身へのフォローは 422 を返す", async () => {
    requireUser.mockResolvedValue({ id: 5, userId: "me", name: "自分" });
    getUserIdByHandle.mockResolvedValue(5);
    const response = await post("me");
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: "自分自身はフォローできません。" },
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("他人をフォローできる", async () => {
    requireUser.mockResolvedValue({ id: 5, userId: "me", name: "自分" });
    getUserIdByHandle.mockResolvedValue(8);
    upsert.mockResolvedValue({});
    count.mockResolvedValue(4);
    const response = await post("other");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      isFollowing: true,
      followerCount: 4,
    });
  });
});
