// GET /api/projects/[projectId] の 404・不正 ID テスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const findUnique = vi.fn();
const toProjectStampSummaries = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
}));

vi.mock("@/lib/api/projectStamp", () => ({
  toProjectStampSummaries: (...args: unknown[]) => toProjectStampSummaries(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

describe("GET /api/projects/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewer.mockResolvedValue(null);
    toProjectStampSummaries.mockResolvedValue([]);
  });

  async function get(projectId: string) {
    const { GET } = await import("./route");
    return GET(new Request(`http://localhost:3000/api/projects/${projectId}`), {
      params: Promise.resolve({ projectId }),
    });
  }

  it("不正な projectId は 404 を返す", async () => {
    const response = await get("abc");
    expect(response.status).toBe(404);
  });

  it("存在しないプロジェクトは 404 を返す", async () => {
    findUnique.mockResolvedValue(null);
    const response = await get("999999");
    expect(response.status).toBe(404);
  });
});
