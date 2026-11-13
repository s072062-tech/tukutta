// 歩みカレンダーの月曜始まり・見出しテスト
import { renderWithProviders } from "@/test/renderWithProviders";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JourneyCalendar } from "./JourneyCalendar";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("JourneyCalendar", () => {
  it("2026年10月は先頭の空セルが3つ（月火水）", () => {
    const { container } = renderWithProviders(
      <JourneyCalendar
        year={2026}
        month={10}
        days={[
          {
            date: "2026-10-20",
            posts: [{ postId: 1, taskName: "マップ生成", time: "18:36" }],
          },
        ]}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByText("2026年10月")).toBeInTheDocument();
    expect(screen.getByText("マップ生成")).toBeInTheDocument();
    expect(screen.getByText("18:36")).toBeInTheDocument();

    const emptyCells = container.querySelectorAll('[aria-hidden="true"]');
    // 先頭3 + 末尾（31日で木始まり → 合計35セル、末尾1）
    expect(emptyCells.length).toBeGreaterThanOrEqual(3);
    const grid = container.querySelector(".grid.grid-cols-7.gap-1:not(.text-center)");
    expect(grid?.children.length).toBe(35);
    expect(grid?.children[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(grid?.children[1]?.getAttribute("aria-hidden")).toBe("true");
    expect(grid?.children[2]?.getAttribute("aria-hidden")).toBe("true");
    expect(grid?.children[3]?.getAttribute("aria-hidden")).toBeNull();
  });
});
