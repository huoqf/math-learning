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
  MathPoint: () => null,
  VectorArrow: () => null,
  Asymptote: () => null,
  IntervalShadow: () => null,
  TangentLine: () => null,
  SecantLine: () => null,
  SceneLegend: () => <div data-testid="scene-legend">图例说明</div>,
}));

import { DoubleVarPage } from "./DoubleVarPage";

describe("DoubleVarPage smoke and logic tests", () => {
  it("renders without crashing with all default panels, legend, tipcard and reasoning steps", () => {
    render(<DoubleVarPage />);
    expect(screen.getByText("博弈量词关系")).toBeInTheDocument();
    expect(screen.getByText("典型构型预设")).toBeInTheDocument();
    expect(screen.getByText("双动点博弈看板")).toBeInTheDocument();
    expect(screen.getByText("自由探究")).toBeInTheDocument();
    // 图例挂载
    expect(screen.getByTestId("scene-legend")).toBeInTheDocument();
    // TipCard 双要素
    expect(screen.getByText("【初始条件】")).toBeInTheDocument();
    expect(screen.getByText("【核心设问】")).toBeInTheDocument();
    // 破题三步推演链
    expect(screen.getByText(/审题定法/)).toBeInTheDocument();
    expect(screen.getByText(/建模联立/)).toBeInTheDocument();
    expect(screen.getByText(/求解反思/)).toBeInTheDocument();
  });

  it("switches logic to same variable mode (差函数法) and updates title", () => {
    render(<DoubleVarPage />);
    const sameVarBtn = screen.getByText("同自变量对垒");
    fireEvent.click(sameVarBtn);
    expect(screen.getAllByText(/同自变量对垒/i).length).toBeGreaterThan(0);
    expect(screen.getByText("同变量差函数看板")).toBeInTheDocument();
    expect(screen.getByText("作用域公共交集")).toBeInTheDocument();
    expect(screen.getByText(/同自变量识别与差函数构造/)).toBeInTheDocument();
  });

  it("switches logic across all quantifier modes and updates reasoning steps", () => {
    render(<DoubleVarPage />);
    // 1. all_exist (任意对存在)
    fireEvent.click(screen.getByText("任意对存在"));
    expect(screen.getAllByText(/极小保底/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/全称对存在量词降维/)).toBeInTheDocument();

    // 2. exist_all (存在对任意)
    fireEvent.click(screen.getByText("存在对任意"));
    expect(screen.getAllByText(/顶峰压制/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/存在对全称顶峰压制建模/)).toBeInTheDocument();

    // 3. exist_exist (存在对存在)
    fireEvent.click(screen.getByText("存在对存在"));
    expect(screen.getAllByText(/门槛局部超越/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/双存在量词门槛超越识别/)).toBeInTheDocument();
  });

  it("applies presets correctly and updates TipCard dynamically", () => {
    render(<DoubleVarPage />);
    // 1. 外切临界
    const touchBtn = screen.getByText("外切临界");
    fireEvent.click(touchBtn);
    expect(screen.getByText(/外切构型 · 双动点极值相切/)).toBeInTheDocument();

    // 2. 完全隔离
    const isolateBtn = screen.getByText("完全隔离");
    fireEvent.click(isolateBtn);
    expect(
      screen.getByText(/隔离构型 · 双动点极值完全分离/),
    ).toBeInTheDocument();

    // 3. 值域交错
    const overlapBtn = screen.getByText("值域交错");
    fireEvent.click(overlapBtn);
    expect(
      screen.getByText(/交错构型 · 双动点值域局部重叠/),
    ).toBeInTheDocument();
  });

  it("adapts preset configurations and TipCard for same variable mode", () => {
    render(<DoubleVarPage />);
    // 切换到同自变量模式
    fireEvent.click(screen.getByText("同自变量对垒"));
    expect(
      screen.getByText("一键直达同变量差函数临界构型"),
    ).toBeInTheDocument();

    // 1. 曲线公切
    const touchBtn = screen.getByText("曲线公切");
    fireEvent.click(touchBtn);
    expect(screen.getByText(/同变量公切 · 差函数恰好相切/)).toBeInTheDocument();
    expect(screen.getByText(/思考两函数顶点/)).toBeInTheDocument();

    // 2. 严格高于
    const isolateBtn = screen.getByText("严格高于");
    fireEvent.click(isolateBtn);
    expect(screen.getByText(/同变量严格高于 · 全程无交点/)).toBeInTheDocument();

    // 3. 交叉穿透
    const crossBtn = screen.getByText("交叉穿透");
    fireEvent.click(crossBtn);
    expect(
      screen.getByText(/同变量交叉穿透 · 产生违背区间/),
    ).toBeInTheDocument();
  });
});
