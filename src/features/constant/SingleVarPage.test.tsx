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
  SceneLegend: ({ title }: { title?: string }) => (
    <div data-testid="scene-legend">{title || "图例说明"}</div>
  ),
}));

import { SingleVarPage } from "./SingleVarPage";

describe("SingleVarPage left panel and reasoning tests", () => {
  it("renders with coherent educational flow: Theme -> Target/Method -> Presets -> Params -> TipCard", () => {
    render(<SingleVarPage />);
    // 1. 核心函数专题
    expect(screen.getByText("核心函数专题")).toBeInTheDocument();
    // 2. 探究目标与解法 (前置)
    expect(screen.getByText("探究目标与解法")).toBeInTheDocument();
    expect(screen.getByText("恒成立 (∀x)")).toBeInTheDocument();
    expect(screen.getByText("参变分离法")).toBeInTheDocument();
    // 3. 典型构型预设 (自适应特化)
    expect(screen.getByText("典型构型预设")).toBeInTheDocument();
    expect(screen.getByText("极值相切")).toBeInTheDocument();
    // 4. 参数调节
    expect(screen.getByText("参数调节")).toBeInTheDocument();
    // 5. 教学导引 (TipCard)
    expect(screen.getByText("教学导引")).toBeInTheDocument();
    expect(screen.getByText("【初始条件】")).toBeInTheDocument();
    expect(screen.getByText("【核心设问】")).toBeInTheDocument();

    // 中屏与右屏
    expect(screen.getByTestId("scene-legend")).toBeInTheDocument();
    expect(screen.getByText("单变量恒成立与存在性看板")).toBeInTheDocument();
    expect(screen.getByText(/第一步：审题定法/)).toBeInTheDocument();
    expect(screen.getByText(/第二步：建模联立/)).toBeInTheDocument();
    expect(screen.getByText(/第三步：求解反思/)).toBeInTheDocument();
  });

  it("adapts preset grid dynamically when switching between 参变分离法 and 直接分类讨论", () => {
    render(<SingleVarPage />);
    // 默认是参变分离法，显示相切与单调段预设
    expect(screen.getByText("极值相切")).toBeInTheDocument();
    expect(screen.getByText("增区间段")).toBeInTheDocument();

    // 切换到直接分类讨论
    const directBtn = screen.getByText("直接分类讨论");
    fireEvent.click(directBtn);

    // 预设自适应变为“驻点在左 / 驻点在内 / 驻点在右”
    expect(screen.getByText("驻点在左")).toBeInTheDocument();
    expect(screen.getByText("驻点在内")).toBeInTheDocument();
    expect(screen.getByText("驻点在右")).toBeInTheDocument();
  });

  it("safely enforces domain requirements when switching between quadratic and transcendent models", () => {
    render(<SingleVarPage />);
    // 1. 切换到二次函数模型
    const quadTab = screen.getByText("二次函数模型");
    fireEvent.click(quadTab);
    expect(screen.getByText(/抛物线恒成立/)).toBeInTheDocument();

    // 2. 切回超越函数模型，定义域安全保护生效
    const transTab = screen.getByText("超越函数压轴");
    fireEvent.click(transTab);
    expect(screen.getByText("对数分式模型")).toBeInTheDocument();
  });

  it("updates TipCard condition and question coherently with quantifier toggle", () => {
    render(<SingleVarPage />);
    // 默认恒成立
    expect(screen.getAllByText(/恒成立/).length).toBeGreaterThan(0);

    // 切换到存在性
    const existBtn = screen.getByText("存在性 (∃x)");
    fireEvent.click(existBtn);

    // TipCard 设问与徽章同步特化为存在性
    expect(screen.getByText(/超越函数存在性/)).toBeInTheDocument();
    expect(screen.getByText(/存在实数解/)).toBeInTheDocument();
  });

  it("disables tangent scaling toggle when current model does not support it", () => {
    render(<SingleVarPage />);
    // 默认对数分式模型，不支持切线放缩
    const tangentBtn = screen.getByText("+ 切线放缩");
    expect(tangentBtn).toBeDisabled();

    // 切换到支持切线放缩的对数线性放缩模型
    const scalingModelBtn = screen.getByText("对数线性放缩");
    fireEvent.click(scalingModelBtn);
    expect(screen.getByText("+ 切线放缩")).not.toBeDisabled();
  });
});
