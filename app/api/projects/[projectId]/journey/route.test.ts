// 歩み GET のクエリ検証テスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    post: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

describe("GET /api/projects/[projectId]/journey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({ id: 10 });
    findMany.mockResolvedValue([]);
  });

  async function get(query = "") {
    const { GET } = await import("./route");
    return GET(
      new Request(`http://localhost:3000/api/projects/10/journey${query}`),
      { params: Promise.resolve({ projectId: "10" }) },
    );
  }

  it("year だけ指定すると 422 を返す", async () => {
    const response = await get("?year=2026");
    expect(response.status).toBe(422);
  });

  it("クエリなしは 200 で year/month を返す", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.year).toEqual(expect.any(Number));
    expect(body.month).toEqual(expect.any(Number));
    expect(body.days).toEqual([]);
  });
});
