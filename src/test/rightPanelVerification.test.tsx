import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@/test/mocks";

// Mock KaTeX and SVG Canvas
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
  VertexLabelGroup3D: () => null,
  RightTriangle3D: () => null,
  AffineBasis3D: () => null,
  SectionPlane3D: () => null,
}));

// 引入本次重构的 22 个组件
import { VectorLinearAnimation } from "@/features/vectorLinear/VectorLinearAnimation";
import { VectorBasisAnimation } from "@/features/vectorBasis/VectorBasisAnimation";
import { VectorDotProductAnimation } from "@/features/vectorDotProduct/VectorDotProductAnimation";
import Vector3DBasisAnimation from "@/features/vector3d/Vector3DBasisAnimation";
import { TrigLinesAnimation } from "@/features/trigLines/TrigLinesAnimation";
import { TrigTransformAnimation } from "@/features/trigTransform/TrigTransformAnimation";
import { TrigFormulasAnimation } from "@/features/trigFormulas/TrigFormulasAnimation";
import { TrigTangentAnimation } from "@/features/trigTangent/TrigTangentAnimation";
import { TrigIdentityAnimation } from "@/features/trigIdentity/TrigIdentityAnimation";
import { TriangleExtremaAnimation } from "@/features/triangleExtrema/TriangleExtremaAnimation";
import { TriangleSolveAnimation } from "@/features/triangleSolve/TriangleSolveAnimation";
import { StatPercentileAnimation } from "@/features/statPercentile/StatPercentileAnimation";
import { ProbabilityNormalAnimation } from "@/features/probabilityNormal/ProbabilityNormalAnimation";
import { ProbabilityDistributionAnimation } from "@/features/probabilityDistribution/ProbabilityDistributionAnimation";
import { ProbabilityCountingAnimation } from "@/features/probabilityCounting/ProbabilityCountingAnimation";
import RotationBodyAnimation from "@/features/solidGeometry/RotationBodyAnimation";
import SurfaceRelationAnimation from "@/features/solidGeometry/SurfaceRelationAnimation";
import LinePlaneRelationAnimation from "@/features/solidGeometry/LinePlaneRelationAnimation";
import FoldingAnimation from "@/features/solidGeometry/FoldingAnimation";
import { SecondDerivativeAnimation } from "@/features/second-derivative/SecondDerivativeAnimation";
import { QuadraticAnimation } from "@/features/quadratic/QuadraticAnimation";
import { TransformAnimation } from "@/features/transform";

describe("右屏重构组件内容正确性与高中数学合规性验证", () => {
  const components = [
    { name: "VectorLinearAnimation", Component: VectorLinearAnimation },
    { name: "VectorBasisAnimation", Component: VectorBasisAnimation },
    { name: "VectorDotProductAnimation", Component: VectorDotProductAnimation },
    { name: "Vector3DBasisAnimation", Component: Vector3DBasisAnimation },
    { name: "TrigLinesAnimation", Component: TrigLinesAnimation },
    { name: "TrigTransformAnimation", Component: TrigTransformAnimation },
    { name: "TrigFormulasAnimation", Component: TrigFormulasAnimation },
    { name: "TrigTangentAnimation", Component: TrigTangentAnimation },
    { name: "TrigIdentityAnimation", Component: TrigIdentityAnimation },
    { name: "TriangleExtremaAnimation", Component: TriangleExtremaAnimation },
    { name: "TriangleSolveAnimation", Component: TriangleSolveAnimation },
    { name: "StatPercentileAnimation", Component: StatPercentileAnimation },
    {
      name: "ProbabilityNormalAnimation",
      Component: ProbabilityNormalAnimation,
    },
    {
      name: "ProbabilityDistributionAnimation",
      Component: ProbabilityDistributionAnimation,
    },
    {
      name: "ProbabilityCountingAnimation",
      Component: ProbabilityCountingAnimation,
    },
    { name: "RotationBodyAnimation", Component: RotationBodyAnimation },
    { name: "SurfaceRelationAnimation", Component: SurfaceRelationAnimation },
    {
      name: "LinePlaneRelationAnimation",
      Component: LinePlaneRelationAnimation,
    },
    { name: "FoldingAnimation", Component: FoldingAnimation },
    { name: "SecondDerivativeAnimation", Component: SecondDerivativeAnimation },
    { name: "QuadraticAnimation", Component: QuadraticAnimation },
    { name: "TransformAnimation", Component: TransformAnimation },
  ];

  components.forEach(({ name, Component }) => {
    it(`${name} 挂载后右屏内容正常，无 NaN/undefined，且公式合规`, () => {
      const { container } = render(<Component />);

      const textContent = container.textContent || "";

      // 1. 严格检查：渲染内容中绝不能存在未定义的浮点异常或字符串错误
      expect(textContent).not.toContain("NaN");
      expect(textContent).not.toContain("undefined");
      expect(textContent).not.toContain("[object Object]");

      // 2. 检查右屏 KaTeX 公式是否存在
      const katexElements = container.querySelectorAll('[data-testid="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);

      // 3. 检查每个公式字符串是否无 NaN / null / undefined 串入
      katexElements.forEach((el) => {
        const formula = el.textContent || "";
        expect(formula).not.toContain("NaN");
        expect(formula).not.toContain("undefined");
        expect(formula).not.toContain("null");
      });
    });
  });
});
