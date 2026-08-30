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

vi.mock("@/components/Layout/ThreeDCanvas", () => ({
  ThreeDCanvas: ({
    legend,
  }: {
    children?: React.ReactNode;
    legend?: React.ReactNode;
  }) => <div data-testid="threed-canvas">{legend}</div>,
}));

vi.mock("@/components/Math3D", () => ({
  Legend3D: () => <div data-testid="legend-3d" />,
  CameraRig: () => null,
  ModeSwitchOverlay3D: () => null,
  Segment3D: () => null,
  Vector3DArrow: () => null,
  Point3D: () => null,
  PointLabel3D: () => null,
  FormulaLabel3D: () => null,
  CompoundLabel3D: () => null,
  AngleArc3D: () => null,
  Polygon3DFace: () => null,
  Scene3DGrid: () => null,
  ThreeViewsPanel: () => null,
  Plane3D: () => null,
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
import RotationBodyAnimation from "@/features/solidGeometry/RotationBodyAnimation";
import LinePlaneRelationAnimation from "@/features/solidGeometry/LinePlaneRelationAnimation";
import SurfaceRelationAnimation from "@/features/solidGeometry/SurfaceRelationAnimation";
import SpatialAngleAnimation from "@/features/solidGeometry/SpatialAngleAnimation";
import SpatialDistanceAnimation from "@/features/solidGeometry/SpatialDistanceAnimation";
import ParametricPointAnimation from "@/features/solidGeometry/ParametricPointAnimation";
import CircumInSphereAnimation from "@/features/solidGeometry/CircumInSphereAnimation";
import PolyhedronCircumSphereAnimation from "@/features/solidGeometry/PolyhedronCircumSphereAnimation";
import AdvancedSphereAnimation from "@/features/solidGeometry/AdvancedSphereAnimation";
import Vector3DBasisAnimation from "@/features/vector3d/Vector3DBasisAnimation";

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
    expect(screen.getByText("研究模块")).toBeInTheDocument();
    expect(screen.getByText("回归分析")).toBeInTheDocument();
  });

  it("ComplexAnimation mounts properly and renders", () => {
    render(<ComplexAnimation />);
    expect(screen.getByText("探究专题模式")).toBeInTheDocument();
    expect(screen.getByText("复平面与向量加减")).toBeInTheDocument();
  });

  // ═════════ 3D 立体几何与空间向量页面冒烟测试 ═════════
  it("RotationBodyAnimation mounts properly", () => {
    render(<RotationBodyAnimation />);
    expect(screen.getAllByText("旋转生成").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/圆柱/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("参数调节").length).toBeGreaterThan(0);
  });

  it("LinePlaneRelationAnimation mounts properly", () => {
    render(<LinePlaneRelationAnimation />);
    expect(screen.getAllByText("线面平行").length).toBeGreaterThan(0);
  });

  it("SurfaceRelationAnimation mounts properly", () => {
    render(<SurfaceRelationAnimation />);
    expect(screen.getAllByText("面面平行判定").length).toBeGreaterThan(0);
  });

  it("SpatialAngleAnimation mounts properly", () => {
    render(<SpatialAngleAnimation />);
    expect(screen.getAllByText("异面直线角").length).toBeGreaterThan(0);
  });

  it("SpatialDistanceAnimation mounts properly with distance mode", () => {
    render(<SpatialDistanceAnimation />);
    expect(screen.getAllByText("点面距离").length).toBeGreaterThan(0);
  });

  it("ParametricPointAnimation mounts properly", () => {
    render(<ParametricPointAnimation />);
    expect(screen.getAllByText("棱上动点与空间角").length).toBeGreaterThan(0);
  });

  it("CircumInSphereAnimation mounts properly", () => {
    render(<CircumInSphereAnimation />);
    expect(screen.getAllByText("外接球").length).toBeGreaterThan(0);
  });

  it("PolyhedronCircumSphereAnimation mounts properly", () => {
    render(<PolyhedronCircumSphereAnimation />);
    expect(screen.getAllByText("墙角模型").length).toBeGreaterThan(0);
  });

  it("AdvancedSphereAnimation mounts properly", () => {
    render(<AdvancedSphereAnimation />);
    expect(screen.getAllByText("面面垂直").length).toBeGreaterThan(0);
  });

  it("Vector3DBasisAnimation mounts properly", () => {
    render(<Vector3DBasisAnimation />);
    expect(screen.getAllByText("基本定理").length).toBeGreaterThan(0);
    expect(screen.getAllByText("坐标运算").length).toBeGreaterThan(0);
  });
});
