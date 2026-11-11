// GET /api/users/[userId] の不正ハンドル・不存在テスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const findUnique = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

describe("GET /api/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewer.mockResolvedValue(null);
  });

  async function get(userId: string) {
    const { GET } = await import("./route");
    return GET(new Request(`http://localhost:3000/api/users/${userId}`), {
      params: Promise.resolve({ userId }),
    });
  }

  it("不正なハンドルは 404 を返す", async () => {
    const response = await get("!!");
    expect(response.status).toBe(404);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("存在しないユーザーは 404 を返す", async () => {
    findUnique.mockResolvedValue(null);
    const response = await get("nobody");
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });
});
