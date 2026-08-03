import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  Asymptote,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { solveConicLineIntersection } from "@/math/conicLine";
import type { ConicType, StudyMode } from "@/math/conicLine";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";

export interface ConicLineSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  conicType: ConicType;
  studyMode: StudyMode;
  onParamChange: (key: string, value: number) => void;
}

export function ConicLineScene({
  params,
  scale,
  vp,
  fontScale,
  conicType,
  studyMode,
  onParamChange,
}: ConicLineSceneProps) {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const p = params.p ?? 2;
  const k = params.k ?? 0.5;
  const m = params.m ?? 0.5;
  const theta = params.theta ?? Math.PI / 4;
  const midpointX = params.midpointX ?? 1;
  const midpointY = params.midpointY ?? 1;

  // 1. 调用纯数学解算器
  const result = useMemo(() => {
    return solveConicLineIntersection({
      conicType,
      studyMode,
      a,
      b,
      p,
      k,
      m,
      theta,
      midpointX,
      midpointY,
    });
  }, [conicType, studyMode, a, b, p, k, m, theta, midpointX, midpointY]);

  // 2. 直线参数 (实际渲染用的 k_eff, m_eff)
  const kEff = result.slopeAB;
  let mEff = m;
  if (studyMode === "focus") {
    mEff = -kEff * result.focusF1.x;
  } else if (studyMode === "midpoint" && result.midpoint) {
    mEff = result.midpoint.y - kEff * result.midpoint.x;
  }

  // 3. 计算坐标系范围内直线的两端点（视口求交）
  const xMin = -6;
  const xMax = 6;
  const lineP1 = mathToDesign(xMin, kEff * xMin + mEff, scale);
  const lineP2 = mathToDesign(xMax, kEff * xMax + mEff, scale);

  // 4. 椭圆/双曲线/抛物线曲线绘制点集
  const conicFnUpper = useMemo(() => {
    return (x: number) => {
      if (conicType === "ellipse") {
        if (Math.abs(x) > a) return NaN;
        return (b / a) * Math.sqrt(a * a - x * x);
      } else if (conicType === "hyperbola") {
        if (Math.abs(x) < a) return NaN;
        return (b / a) * Math.sqrt(x * x - a * a);
      } else {
        // 抛物线 y^2 = 2px => y = sqrt(2px)
        if (x < 0) return NaN;
        return Math.sqrt(2 * p * x);
      }
    };
  }, [conicType, a, b, p]);

  const conicFnLower = useMemo(() => {
    return (x: number) => {
      const u = conicFnUpper(x);
      return isNaN(u) ? NaN : -u;
    };
  }, [conicFnUpper]);

  // 5. 焦点与原点坐标
  const originD = mathToDesign(0, 0, scale);
  const focus1D = mathToDesign(result.focusF1.x, result.focusF1.y, scale);
  const focus2D = result.focusF2
    ? mathToDesign(result.focusF2.x, result.focusF2.y, scale)
    : null;

  // 6. 交点 A, B 坐标投射
  const intersectionDesignPoints = useMemo(() => {
    return result.intersections.map((pt) => mathToDesign(pt.x, pt.y, scale));
  }, [result.intersections, scale]);

  // 弦中点 M 坐标投射
  const midpointD = result.midpoint
    ? mathToDesign(result.midpoint.x, result.midpoint.y, scale)
    : null;

  // 7. 标注项目
  const labelItems = useMemo(() => {
    const raw: { x: number; y: number; text: string; color: string }[] = [
      { x: originD.x, y: originD.y, text: "O", color: MATH_COLORS.axis },
      {
        x: focus1D.x,
        y: focus1D.y,
        text: conicType === "parabola" ? "F" : "F1",
        color: MATH_COLORS.accent,
      },
    ];
    if (focus2D) {
      raw.push({
        x: focus2D.x,
        y: focus2D.y,
        text: "F2",
        color: MATH_COLORS.accent,
      });
    }

    if (intersectionDesignPoints.length >= 1) {
      raw.push({
        x: intersectionDesignPoints[0].x,
        y: intersectionDesignPoints[0].y,
        text: result.intersectionCount === 1 ? "P0(切点/交点)" : "A",
        color: MATH_COLORS.paramPrimary,
      });
    }
    if (intersectionDesignPoints.length === 2) {
      raw.push({
        x: intersectionDesignPoints[1].x,
        y: intersectionDesignPoints[1].y,
        text: "B",
        color: MATH_COLORS.paramPrimary,
      });
    }

    if (midpointD && studyMode === "midpoint") {
      raw.push({
        x: midpointD.x,
        y: midpointD.y,
        text: "M(弦中点)",
        color: MATH_COLORS.paramSecondary,
      });
    }

    return raw;
  }, [
    originD,
    focus1D,
    focus2D,
    intersectionDesignPoints,
    midpointD,
    studyMode,
    conicType,
    result.intersectionCount,
  ]);

  // 8. 原点三角形 △OAB 填充路径
  const trianglePath = useMemo(() => {
    if (intersectionDesignPoints.length === 2) {
      const [pA, pB] = intersectionDesignPoints;
      return `M ${originD.x} ${originD.y} L ${pA.x} ${pA.y} L ${pB.x} ${pB.y} Z`;
    }
    return "";
  }, [originD, intersectionDesignPoints]);

  // 9. 交互拖拽中点 M 回调
  const handleDragMidpoint = (mathPt: { x: number; y: number }) => {
    const roundedX = Math.round(mathPt.x * 10) / 10;
    const roundedY = Math.round(mathPt.y * 10) / 10;
    onParamChange("midpointX", roundedX);
    onParamChange("midpointY", roundedY);
  };

  return (
    <g>
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 双曲线渐近线 y = ±(b/a)x */}
      {conicType === "hyperbola" && (
        <>
          <Asymptote
            type="oblique"
            value={b / a}
            scale={scale}
            fontScale={fontScale}
            label="y=(b/a)x"
          />
          <Asymptote
            type="oblique"
            value={-b / a}
            scale={scale}
            fontScale={fontScale}
            label="y=-(b/a)x"
          />
        </>
      )}

      {/* 圆锥曲线主体 (上下分支) */}
      <FunctionGraph
        fn={conicFnUpper}
        scale={scale}
        color={MATH_COLORS.primary}
        strokeWidth={2.5}
        samples={300}
      />
      <FunctionGraph
        fn={conicFnLower}
        scale={scale}
        color={MATH_COLORS.primary}
        strokeWidth={2.5}
        samples={300}
      />

      {/* 原点三角形 △OAB 填充 */}
      {trianglePath && (
        <path
          d={trianglePath}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.15)}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      )}

      {/* 全程延伸直线 y = kx + m (长虚线) */}
      <line
        x1={lineP1.x}
        y1={lineP1.y}
        x2={lineP2.x}
        y2={lineP2.y}
        stroke={withAlpha(MATH_COLORS.line, 0.6)}
        strokeWidth={1.5}
        strokeDasharray="6,4"
      />

      {/* 相交弦 AB 高亮实线 */}
      {intersectionDesignPoints.length === 2 && (
        <line
          x1={intersectionDesignPoints[0].x}
          y1={intersectionDesignPoints[0].y}
          x2={intersectionDesignPoints[1].x}
          y2={intersectionDesignPoints[1].y}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={3.5}
        />
      )}

      {/* 弦中点连线 OM */}
      {midpointD && (
        <line
          x1={originD.x}
          y1={originD.y}
          x2={midpointD.x}
          y2={midpointD.y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2}
          strokeDasharray="3,3"
        />
      )}

      {/* 焦点点标 */}
      <circle cx={focus1D.x} cy={focus1D.y} r={4.5} fill={MATH_COLORS.accent} />
      {focus2D && (
        <circle
          cx={focus2D.x}
          cy={focus2D.y}
          r={4.5}
          fill={MATH_COLORS.accent}
        />
      )}

      {/* 弦交点 A, B */}
      {intersectionDesignPoints.map((pt, idx) => (
        <g key={idx}>
          <circle cx={pt.x} cy={pt.y} r={5} fill={MATH_COLORS.paramPrimary} />
          <circle
            cx={pt.x}
            cy={pt.y}
            r={8}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            opacity={0.6}
          />
        </g>
      ))}

      {/* 可拖拽弦中点 M (在中点模式下) */}
      {result.midpoint && studyMode === "midpoint" && (
        <InteractivePoint
          cx={result.midpoint.x}
          cy={result.midpoint.y}
          scale={scale}
          vp={vp}
          fontScale={fontScale}
          color={MATH_COLORS.paramSecondary}
          onDrag={handleDragMidpoint}
        />
      )}

      {/* 文本标签 */}
      {labelItems.map((lbl: any, idx: number) => (
        <text
          key={idx}
          x={lbl.x + 8}
          y={lbl.y - 8}
          fontSize={fontScale(12)}
          fill={lbl.color}
          fontWeight="600"
          className="select-none"
        >
          {lbl.text}
        </text>
      ))}
    </g>
  );
}
