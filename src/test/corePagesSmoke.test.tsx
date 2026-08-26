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

describe("Core Feature Pages Smoke & Rendering Tests", () => {
  it("LineEquationAnimation mounts properly and displays control panel", () => {
    render(<LineEquationAnimation />);
    expect(screen.getByText("研究模式")).toBeInTheDocument();
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
    expect(screen.getByText("核心数值指标")).toBeInTheDocument();
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
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
  });

  it("TriangleExtremaAnimation mounts properly and renders", () => {
    render(<TriangleExtremaAnimation />);
    expect(screen.getByText("最值研究模型")).toBeInTheDocument();
    expect(screen.getByText("正弦角化边")).toBeInTheDocument();
    expect(screen.getByText("阿波罗尼斯圆")).toBeInTheDocument();
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
  });

  it("InequalityAbsoluteAnimation mounts properly and renders", () => {
    render(<InequalityAbsoluteAnimation />);
    expect(screen.getByText("研究模式")).toBeInTheDocument();
    expect(screen.getByText("三角不等式")).toBeInTheDocument();
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
  });

  it("SetVennPage mounts properly and renders", () => {
    render(<SetVennPage />);
    expect(screen.getByText("集合运算")).toBeInTheDocument();
    expect(screen.getByText("实时指标看板")).toBeInTheDocument();
  });
});
