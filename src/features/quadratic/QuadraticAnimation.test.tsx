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
    const equationBtn = screen.getByRole("radio", { name: "一元二次方程" });
    fireEvent.click(equationBtn);
    // 切换后该模式被选中为激活态（SelectGrid 通过 aria-checked 表达选中状态）
    expect(equationBtn).toHaveAttribute("aria-checked", "true");
  });

  it("shows inequality section when inequality mode is selected", () => {
    render(<QuadraticAnimation />);
    fireEvent.click(screen.getByText("一元二次不等式"));
    expect(screen.getByText("不等号方向")).toBeInTheDocument();
    // 选项同时渲染 label 与 KaTeX 公式，命中可能为多个，断言至少存在
    expect(screen.getAllByText("f(x) > 0").length).toBeGreaterThan(0);
  });
});
