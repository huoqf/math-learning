import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, Asymptote } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap, type LabelItem } from "@/utils/labelOverlap";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  solveConicLineIntersection,
  type ConicType,
  type StudyMode,
} from "@/math/conicLine";

interface ConicLineSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  conicType: ConicType;
  studyMode: StudyMode;
}

export const ConicLineScene: React.FC<ConicLineSceneProps> = ({
  params,
  scale,
  fontScale = (v) => v,
  conicType,
  studyMode,
}) => {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const p = params.p ?? 2;
  const k = params.k ?? 1;
  const m = params.m ?? 0;

  // 1. 求解相交计算结果
  const result = useMemo(
    () => solveConicLineIntersection({ conicType, ...params } as any),
    [conicType, params],
  );

  // 2. 直线参数 y = kx + m
  const kEff = k;
  const mEff = m;

  // 直线两端延伸点 (视口边界 Math X = -6 ~ +6)
  const xMin = -6;
  const xMax = 6;
  const lineP1 = mathToDesign(xMin, kEff * xMin + mEff, scale);
  const lineP2 = mathToDesign(xMax, kEff * xMax + mEff, scale);

  // 3. 焦点与原点坐标
  const originD = mathToDesign(0, 0, scale);
  const focus1D = mathToDesign(result.focusF1.x, result.focusF1.y, scale);
  const focus2D = result.focusF2
    ? mathToDesign(result.focusF2.x, result.focusF2.y, scale)
    : null;

  // 4. 交点 A, B 坐标投射
  const intersectionDesignPoints = useMemo(() => {
    return result.intersections.map((pt: { x: number; y: number }) =>
      mathToDesign(pt.x, pt.y, scale),
    );
  }, [result.intersections, scale]);

  // 弦中点 M 坐标投射
  const midpointD = result.midpoint
    ? mathToDesign(result.midpoint.x, result.midpoint.y, scale)
    : null;

  // 5. 组装待避让的 Label 列表
  const rawLabels = useMemo(() => {
    const raw: LabelItem[] = [
      {
        key: "O",
        x: originD.x,
        y: originD.y + 12,
        text: "O(0,0)",
      },
      {
        key: "F1",
        x: focus1D.x,
        y: focus1D.y - 12,
        text: conicType === "parabola" ? "F" : "F1",
      },
    ];
    if (focus2D) {
      raw.push({
        key: "F2",
        x: focus2D.x,
        y: focus2D.y - 12,
        text: "F2",
      });
    }

    if (intersectionDesignPoints.length >= 1) {
      raw.push({
        key: "A",
        x: intersectionDesignPoints[0].x,
        y: intersectionDesignPoints[0].y - 12,
        text: result.intersectionCount === 1 ? "P0(切点/交点)" : "A",
      });
    }
    if (intersectionDesignPoints.length === 2) {
      raw.push({
        key: "B",
        x: intersectionDesignPoints[1].x,
        y: intersectionDesignPoints[1].y - 12,
        text: "B",
      });
    }

    if (midpointD && studyMode === "midpoint") {
      raw.push({
        key: "M",
        x: midpointD.x,
        y: midpointD.y + 14,
        text: "M(弦中点)",
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

  const adjustedLabels = useMemo(
    () => avoidLabelOverlap(rawLabels, 16),
    [rawLabels],
  );

  // 6. 原点三角形 △OAB 填充路径
  const trianglePath = useMemo(() => {
    if (intersectionDesignPoints.length === 2) {
      const [pA, pB] = intersectionDesignPoints;
      return `M ${originD.x} ${originD.y} L ${pA.x} ${pA.y} L ${pB.x} ${pB.y} Z`;
    }
    return "";
  }, [originD, intersectionDesignPoints]);

  // 7. 抛物线 path: 以 y 轴为参数 [-9, 9] 采样 x = y^2 / (2p)
  const parabolaPathD = useMemo(() => {
    if (conicType !== "parabola") return "";
    const samples = 200;
    const yMin = -9;
    const yMax = 9;
    const step = (yMax - yMin) / samples;
    let d = "";
    for (let i = 0; i <= samples; i++) {
      const y = yMin + i * step;
      const x = (y * y) / (2 * p);
      const pt = mathToDesign(x, y, scale);
      d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }, [conicType, p, scale]);

  // 双曲线 path: 以 y 轴为参数 [-9, 9] 采样 x = ±a √(1 + y^2/b^2)
  const hyperbolaRightPathD = useMemo(() => {
    if (conicType !== "hyperbola") return "";
    const samples = 200;
    const yMin = -9;
    const yMax = 9;
    const step = (yMax - yMin) / samples;
    let d = "";
    for (let i = 0; i <= samples; i++) {
      const y = yMin + i * step;
      const x = a * Math.sqrt(1 + (y * y) / (b * b));
      const pt = mathToDesign(x, y, scale);
      d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }, [conicType, a, b, scale]);

  const hyperbolaLeftPathD = useMemo(() => {
    if (conicType !== "hyperbola") return "";
    const samples = 200;
    const yMin = -9;
    const yMax = 9;
    const step = (yMax - yMin) / samples;
    let d = "";
    for (let i = 0; i <= samples; i++) {
      const y = yMin + i * step;
      const x = -a * Math.sqrt(1 + (y * y) / (b * b));
      const pt = mathToDesign(x, y, scale);
      d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }, [conicType, a, b, scale]);

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

      {/* 圆锥曲线主体渲染 (解决坐标轴顶点断裂缝隙) */}
      {conicType === "ellipse" && (
        <ellipse
          cx={originD.x}
          cy={originD.y}
          rx={a * scale.scaleX}
          ry={b * scale.scaleY}
          fill="none"
          stroke={MATH_COLORS.primary}
          strokeWidth={2.5}
        />
      )}

      {conicType === "parabola" && (
        <path
          d={parabolaPathD}
          fill="none"
          stroke={MATH_COLORS.primary}
          strokeWidth={2.5}
        />
      )}

      {conicType === "hyperbola" && (
        <>
          <path
            d={hyperbolaRightPathD}
            fill="none"
            stroke={MATH_COLORS.primary}
            strokeWidth={2.5}
          />
          <path
            d={hyperbolaLeftPathD}
            fill="none"
            stroke={MATH_COLORS.primary}
            strokeWidth={2.5}
          />
        </>
      )}

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

      {/* 交点 A 与 B */}
      {intersectionDesignPoints.map(
        (pt: { x: number; y: number }, idx: number) => (
          <circle
            key={`intersect-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={6}
            fill={MATH_COLORS.paramPrimary}
          />
        ),
      )}

      {/* 弦中点 M */}
      {midpointD && studyMode === "midpoint" && (
        <circle
          cx={midpointD.x}
          cy={midpointD.y}
          r={5.5}
          fill={MATH_COLORS.paramSecondary}
        />
      )}

      {/* 避让算法排布标注文本 */}
      {adjustedLabels.map((lbl) => (
        <text
          key={lbl.key}
          x={lbl.x}
          y={lbl.y + (lbl.finalDy ?? 0)}
          fill={
            lbl.key === "O"
              ? MATH_COLORS.line
              : lbl.key === "F1" || lbl.key === "F2"
                ? MATH_COLORS.accent
                : lbl.key === "M"
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.paramPrimary
          }
          fontSize={fontScale(12)}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {lbl.text}
        </text>
      ))}
    </g>
  );
};
