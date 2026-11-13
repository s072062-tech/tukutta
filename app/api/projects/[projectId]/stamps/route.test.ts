// プロジェクトスタンプの 409 重ね送りテスト
import { Prisma } from "@/app/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();
const toProjectStampSummaries = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/api/projectStamp", () => ({
  toProjectStampSummaries: (...args: unknown[]) => toProjectStampSummaries(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    projectStamp: {
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

describe("POST /api/projects/[projectId]/stamps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({ id: 10 });
  });

  async function post(projectId: string, body: unknown) {
    const { POST } = await import("./route");
    return POST(
      new Request(`http://localhost:3000/api/projects/${projectId}/stamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ projectId }) },
    );
  }

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
});
