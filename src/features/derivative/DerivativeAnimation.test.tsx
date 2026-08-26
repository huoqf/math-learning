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
  MathPoint: () => null,
  VectorArrow: () => null,
  Asymptote: () => null,
  IntervalShadow: () => null,
  TangentLine: () => null,
  SecantLine: () => null,
  SceneLegend: () => null,
  SceneLabelGroup: () => null,
}));

import { DerivativeAnimation } from "./DerivativeAnimation";

describe("DerivativeAnimation", () => {
  it("renders without crashing with all essential sections", () => {
    render(<DerivativeAnimation />);
    expect(screen.getByText("探究模式")).toBeInTheDocument();
    expect(screen.getByText("函数模型")).toBeInTheDocument();
    expect(screen.getByText("参数调节")).toBeInTheDocument();
    expect(screen.getByText("教学导引与题设背景")).toBeInTheDocument();
  });

  it("displays mode options properly", () => {
    render(<DerivativeAnimation />);
    expect(screen.getByText("割线极限逼近")).toBeInTheDocument();
    expect(screen.getByText("切线方程性质")).toBeInTheDocument();
  });

  it("has MathPanel with correct title and gaokao points", () => {
    render(<DerivativeAnimation />);
    expect(screen.getByText("导数几何意义看板")).toBeInTheDocument();
    expect(screen.getByText(/求切线 4 步规范/)).toBeInTheDocument();
  });

  it("renders KaTeX formulas", () => {
    render(<DerivativeAnimation />);
    const katexElements = screen.getAllByTestId("katex");
    expect(katexElements.length).toBeGreaterThan(0);
  });
});
