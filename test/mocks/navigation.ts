// next/navigation のモック用ヘルパー
import { vi } from "vitest";

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

export const mockSearchParams = new URLSearchParams();
export const mockParams: Record<string, string> = {};

export function resetNavigationMocks() {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.prefetch.mockReset();
  mockRouter.back.mockReset();
  mockRouter.forward.mockReset();
  mockRouter.refresh.mockReset();
  for (const key of [...mockSearchParams.keys()]) {
    mockSearchParams.delete(key);
  }
  for (const key of Object.keys(mockParams)) {
    delete mockParams[key];
  }
}

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  useParams: () => mockParams,
  usePathname: () => "/",
}));
