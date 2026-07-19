import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

import { QuadraticAnimation } from "./QuadraticAnimation";

describe("QuadraticAnimation smoke test", () => {
  it("renders without crashing", () => {
    render(<QuadraticAnimation />);
    expect(screen.getByText("二次函数性质")).toBeInTheDocument();
    expect(screen.getByText("一元二次方程")).toBeInTheDocument();
    expect(screen.getByText("一元二次不等式")).toBeInTheDocument();
  });

  it("displays parameter section", () => {
    render(<QuadraticAnimation />);
    expect(screen.getByText("参数调节")).toBeInTheDocument();
  });

  it("switches study mode on button click", () => {
    render(<QuadraticAnimation />);
    const equationBtn = screen.getByText("一元二次方程");
    fireEvent.click(equationBtn);
    expect(equationBtn).toHaveClass("bg-primary-500");
  });

  it("shows inequality section when inequality mode is selected", () => {
    render(<QuadraticAnimation />);
    fireEvent.click(screen.getByText("一元二次不等式"));
    expect(screen.getByText("不等号方向")).toBeInTheDocument();
    expect(screen.getByText("选择解集的大于/小于关系")).toBeInTheDocument();
  });
});
