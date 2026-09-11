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
  SceneLegend: () => <div data-testid="scene-legend" />,
  SceneLabelGroup: () => null,
}));

import { QuadraticAnimation } from "./QuadraticAnimation";

describe("QuadraticAnimation 页面测试与高考规范核查", () => {
  it("挂载成功并渲染三大研究模式", () => {
    render(<QuadraticAnimation />);
    expect(screen.getByText("二次函数性质")).toBeInTheDocument();
    expect(screen.getByText("一元二次方程")).toBeInTheDocument();
    expect(screen.getByText("一元二次不等式")).toBeInTheDocument();
  });

  it("渲染高考典型情景选项与参数调节控制台", () => {
    render(<QuadraticAnimation />);
    expect(screen.getByText("典型高考情景")).toBeInTheDocument();
    expect(screen.getByText("相交两点")).toBeInTheDocument();
    expect(screen.getByText("相切临界")).toBeInTheDocument();
    expect(screen.getByText("相离悬空")).toBeInTheDocument();
    expect(screen.getByText("开口向下")).toBeInTheDocument();
    expect(screen.getByText("退化直线")).toBeInTheDocument();
    expect(screen.getByText("自由探索")).toBeInTheDocument();
    expect(screen.getByText("参数调节")).toBeInTheDocument();
  });

  it("切换典型情景并驱动题设与推导步骤", () => {
    render(<QuadraticAnimation />);
    const tangentBtn = screen.getByRole("radio", { name: "相切临界" });
    fireEvent.click(tangentBtn);
    expect(tangentBtn).toHaveAttribute("aria-checked", "true");
    // 检查 TipCard 题设包含相切特征
    expect(screen.getByText("高考临界 · 二次方程两重实根")).toBeInTheDocument();
  });

  it("平滑切换为一元二次方程模式并展示判别式指标", () => {
    render(<QuadraticAnimation />);
    const equationBtn = screen.getByRole("radio", { name: "一元二次方程" });
    fireEvent.click(equationBtn);
    expect(equationBtn).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("一元二次方程指标看板")).toBeInTheDocument();
    expect(screen.getByText("判别式")).toBeInTheDocument();
  });

  it("切换为一元二次不等式模式展示不等号方向与解集", () => {
    render(<QuadraticAnimation />);
    const ineqBtn = screen.getByRole("radio", { name: "一元二次不等式" });
    fireEvent.click(ineqBtn);
    expect(screen.getByText("一元二次不等式指标看板")).toBeInTheDocument();
    expect(screen.getByText("不等号方向")).toBeInTheDocument();
    expect(screen.getByText("大于零 (上方)")).toBeInTheDocument();
    expect(screen.getByText("解集范围")).toBeInTheDocument();
  });
});
