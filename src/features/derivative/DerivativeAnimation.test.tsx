import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../test/mocks";

vi.mock("@/components/UI/KatexFormula", () => ({
  KatexFormula: ({ formula }: { formula: string }) => (
    <span data-testid="katex">{formula}</span>
  ),
}));

vi.mock("@/components/Math", () => ({
  CoordinateGrid: () => <div data-testid="coordinate-grid" />,
  FunctionGraph: () => null,
  InteractivePoint: () => null,
  VectorArrow: () => null,
  Asymptote: () => null,
  IntervalShadow: () => null,
  TangentLine: () => null,
  SecantLine: () => null,
}));

import { DerivativeAnimation } from "./DerivativeAnimation";

describe("DerivativeAnimation smoke test", () => {
  it("renders without crashing", () => {
    render(<DerivativeAnimation />);
    expect(screen.getByText("函数模型")).toBeInTheDocument();
    expect(screen.getByText("参数调节")).toBeInTheDocument();
  });

  it("displays function preset buttons in section", () => {
    render(<DerivativeAnimation />);
    const section = screen.getByText("函数模型").closest("section");
    expect(section).toBeTruthy();
    expect(section!.querySelectorAll("button").length).toBeGreaterThan(0);
  });

  it("has MathPanel with correct title", () => {
    render(<DerivativeAnimation />);
    expect(screen.getByText("导数几何意义看板")).toBeInTheDocument();
  });

  it("renders KaTeX formulas", () => {
    render(<DerivativeAnimation />);
    const katexElements = screen.getAllByTestId("katex");
    expect(katexElements.length).toBeGreaterThan(0);
  });
});
