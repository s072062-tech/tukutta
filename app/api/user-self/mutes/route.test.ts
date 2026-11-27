// GET /api/user-self/mutes の認証・一覧テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mute: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

describe("GET /api/user-self/mutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function get(url = "http://localhost:3000/api/user-self/mutes") {
    const { GET } = await import("./route");
    return GET(new Request(url));
  }

  it("未ログインなら 401 を返す", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await get();
    expect(response.status).toBe(401);
  });

  it("ミュート一覧を返す", async () => {
    requireUser.mockResolvedValue({
      id: 1,
      userId: "me",
      name: "自分",
      authUserId: "auth-1",
    });
    findMany.mockResolvedValue([
      {
        id: 10,
        mutedUser: { id: 2, userId: "other", name: "相手" },
      },
    ]);

    const response = await get();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [{ id: 2, userId: "other", name: "相手" }],
      nextCursor: null,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { muterId: 1 },
        take: 21,
      }),
    );
  });

  it("0件なら空配列を返す", async () => {
    requireUser.mockResolvedValue({
      id: 1,
      userId: "me",
      name: "自分",
      authUserId: "auth-1",
    });
    findMany.mockResolvedValue([]);

    const response = await get();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
  });
});
