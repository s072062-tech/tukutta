// ProjectSearchInput の Enter 確定と IME 中スキップテスト
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectSearchInput } from "./ProjectSearchInput";

describe("ProjectSearchInput", () => {
  it("Enter で onSubmit を呼ぶ", () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ProjectSearchInput value="カピ" onChange={vi.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalled();
  });

  it("IME 変換中の Enter では onSubmit を呼ばない", () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ProjectSearchInput value="カピ" onChange={vi.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.keyDown(screen.getByRole("searchbox"), {
      key: "Enter",
      isComposing: true,
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
