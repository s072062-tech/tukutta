// タスク登録の権限テスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    task: {
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

describe("POST /api/projects/[projectId]/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(projectId: string, body: unknown) {
    const { POST } = await import("./route");
    return POST(
      new Request(`http://localhost:3000/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ projectId }) },
    );
  }

  it("登録者以外は 403 を返す", async () => {
    requireUser.mockResolvedValue({ id: 2, userId: "other", name: "他人" });
    findUnique.mockResolvedValue({ id: 10, ownerId: 1 });
    const response = await post("10", { name: "マップ", status: "未着手" });
    expect(response.status).toBe(403);
  });
});
