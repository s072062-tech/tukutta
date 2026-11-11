// useAuth / useLoginGuard 系のモックヘルパー
import type { GetMeResponse, UserSelf } from "@/app/api/user-self/route";
import { vi } from "vitest";

export type AuthStatus = "loading" | "guest" | "noProfile" | "ready";

export const mockMutate = vi.fn(async () => undefined);

export const authState: {
  status: AuthStatus;
  me: UserSelf | null;
} = {
  status: "guest",
  me: null,
};

export function setAuthState(status: AuthStatus, me: UserSelf | null = null) {
  authState.status = status;
  authState.me = me;
}

export function resetAuthMocks() {
  mockMutate.mockReset();
  mockMutate.mockResolvedValue(undefined);
  setAuthState("guest", null);
}

export function createReadyUser(overrides?: Partial<UserSelf>): UserSelf {
  return {
    id: 1,
    userId: "satogames",
    name: "佐藤ゲームズ",
    ...overrides,
  };
}

export function toMeResponse(): GetMeResponse {
  if (authState.status === "ready" && authState.me) {
    return { status: "ready", user: authState.me };
  }
  if (authState.status === "noProfile") {
    return { status: "noProfile", user: null, email: "user@example.com" };
  }
  return { status: "guest", user: null };
}
