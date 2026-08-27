import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@/test/mocks";

// Mock KaTeX and SVG Canvas to ensure fast and isolated UI tree validation
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
  MathPoint: () => null,
  SceneLegend: () => null,
  SceneLabelGroup: () => null,
}));

import { LineEquationAnimation } from "@/features/lineEquation/LineEquationAnimation";
import { LineCircleAnimation } from "@/features/line-circle/LineCircleAnimation";
import { TriangleSolveAnimation } from "@/features/triangleSolve/TriangleSolveAnimation";
import { TriangleExtremaAnimation } from "@/features/triangleExtrema/TriangleExtremaAnimation";
import { InequalityAbsoluteAnimation } from "@/features/inequalityAbsolute/InequalityAbsoluteAnimation";
import { SetVennPage } from "@/features/set/SetVennPage";
import { SequenceAnimation } from "@/features/sequence/SequenceAnimation";
import { ParabolaAnimation } from "@/features/parabola/ParabolaAnimation";
import { ConicHomogenizationAnimation } from "@/features/conicHomogenization/ConicHomogenizationAnimation";
import { DerivativeShiftAnimation } from "@/features/derivativeShift/DerivativeShiftAnimation";
import { ProbabilityDistributionAnimation } from "@/features/probabilityDistribution/ProbabilityDistributionAnimation";
import { PairedDataAnimation } from "@/features/pairedData/PairedDataAnimation";
import { ComplexAnimation } from "@/features/complex/ComplexAnimation";

describe("Core Feature Pages Smoke & Rendering Tests", () => {
  it("LineEquationAnimation mounts properly and displays control panel", () => {
    render(<LineEquationAnimation />);
    expect(screen.getByText("研究模式")).toBeInTheDocument();
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
  });

  it("LineCircleAnimation mounts properly and renders titles", () => {
    render(<LineCircleAnimation />);
    expect(screen.getByText("探究主题")).toBeInTheDocument();
    expect(screen.getByText("典型预设")).toBeInTheDocument();
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
  });

  it("TriangleSolveAnimation mounts properly and renders study mode", () => {
    render(<TriangleSolveAnimation />);
    expect(screen.getByText("解三角形专题模式")).toBeInTheDocument();
    expect(screen.getByText("正弦与外接圆")).toBeInTheDocument();
  });

  it("TriangleExtremaAnimation mounts properly and renders", () => {
    render(<TriangleExtremaAnimation />);
    expect(screen.getByText("最值研究模型")).toBeInTheDocument();
    expect(screen.getByText("正弦角化边")).toBeInTheDocument();
  });

  it("InequalityAbsoluteAnimation mounts properly and renders", () => {
    render(<InequalityAbsoluteAnimation />);
    expect(screen.getByText("研究模式")).toBeInTheDocument();
    expect(screen.getByText("三角不等式")).toBeInTheDocument();
  });

  it("SetVennPage mounts properly and renders", () => {
    render(<SetVennPage />);
    expect(screen.getByText("集合运算")).toBeInTheDocument();
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
  });

  it("SequenceAnimation mounts properly and renders", () => {
    render(<SequenceAnimation />);
    expect(screen.getByText("数列类型与研究模式")).toBeInTheDocument();
    expect(screen.getByText("等差数列")).toBeInTheDocument();
  });

  it("ParabolaAnimation mounts properly and renders", () => {
    render(<ParabolaAnimation />);
    expect(screen.getByText("抛物线开向")).toBeInTheDocument();
    expect(screen.getByText("第一定义与焦半径")).toBeInTheDocument();
  });

  it("ConicHomogenizationAnimation mounts properly and renders", () => {
    render(<ConicHomogenizationAnimation />);
    expect(screen.getByText("椭圆")).toBeInTheDocument();
    expect(screen.getByText("探究模式")).toBeInTheDocument();
  });

  it("DerivativeShiftAnimation mounts properly and renders", () => {
    render(<DerivativeShiftAnimation />);
    expect(screen.getByText("模式选择")).toBeInTheDocument();
    expect(screen.getByText("隐零点与消元")).toBeInTheDocument();
  });

  it("ProbabilityDistributionAnimation mounts properly and renders", () => {
    render(<ProbabilityDistributionAnimation />);
    expect(screen.getByText("概率模型与性质")).toBeInTheDocument();
    expect(screen.getByText("二项分布与最值项")).toBeInTheDocument();
  });

  it("PairedDataAnimation mounts properly and renders", () => {
    render(<PairedDataAnimation />);
    expect(screen.getByText("统计分析模式")).toBeInTheDocument();
    expect(screen.getByText("回归分析")).toBeInTheDocument();
  });

  it("ComplexAnimation mounts properly and renders", () => {
    render(<ComplexAnimation />);
    expect(screen.getByText("探究专题模式")).toBeInTheDocument();
    expect(screen.getByText("复平面与向量加减")).toBeInTheDocument();
  });
});
