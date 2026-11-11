// /auth/callback の振り分けユニットテスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const findUnique = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique },
  },
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function getHandler() {
    const mod = await import("./route");
    return mod.GET;
  }

  it("code が無いと /login?error=auth へリダイレクトする", async () => {
    const GET = await getHandler();
    const response = await GET(new Request("http://localhost:3000/auth/callback"));
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/login?error=auth");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("exchange 失敗時は /login?error=auth へリダイレクトする", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid" },
    });
    const GET = await getHandler();
    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc"),
    );
    expect(response.headers.get("Location")).toBe("http://localhost:3000/login?error=auth");
  });

  it("User 行がある場合は /home へリダイレクトする", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    findUnique.mockResolvedValue({ id: 1 });
    const GET = await getHandler();
    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc"),
    );
    expect(response.headers.get("Location")).toBe("http://localhost:3000/home");
    expect(findUnique).toHaveBeenCalledWith({
      where: { authUserId: "auth-1" },
      select: { id: true },
    });
  });

  it("User 行が無い場合は /signup?step=profile へリダイレクトする", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "auth-2" } },
      error: null,
    });
    findUnique.mockResolvedValue(null);
    const GET = await getHandler();
    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc"),
    );
    expect(response.headers.get("Location")).toBe(
      "http://localhost:3000/signup?step=profile",
    );
  });
});
