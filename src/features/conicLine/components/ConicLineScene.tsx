import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  Asymptote,
  InteractivePoint,
  MathPoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap, type LabelItem } from "@/utils/labelOverlap";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  solveConicLineIntersection,
  type ConicType,
  type StudyMode,
  type ConicLineParams,
  type Point2D,
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
  vp,
  fontScale = (v) => v,
  conicType,
  studyMode,
  onParamChange,
}) => {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const p = params.p ?? 2;
  const k = params.k ?? 1;
  const m = params.m ?? 0;

  // 1. 求解相交计算结果
  const result = useMemo(
    () =>
      solveConicLineIntersection({
        conicType,
        studyMode,
        ...params,
      } as ConicLineParams),
    [conicType, studyMode, params],
  );

  // 2. 直线参数 y = kx + m
  const kEff = k;
  const mEff = m;

  // 直线两端延伸点 (视口边界 Math X = -6 ~ +6，铅垂线则沿 Y 轴 -8 ~ +8 延伸)
  const xMin = -6;
  const xMax = 6;
  const isVert = result.isVertical && result.verticalX !== null;
  const lineP1 = isVert
    ? mathToDesign(result.verticalX!, -8, scale)
    : mathToDesign(xMin, kEff * xMin + mEff, scale);
  const lineP2 = isVert
    ? mathToDesign(result.verticalX!, 8, scale)
    : mathToDesign(xMax, kEff * xMax + mEff, scale);

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

  // 准线与垂足坐标 (抛物线专属)
  const directrixX = -p / 2;
  const directrixP1 = mathToDesign(directrixX, -8, scale);
  const directrixP2 = mathToDesign(directrixX, 8, scale);

  // 抛物线焦点弦端点到准线的垂足
  const projectionPoints = useMemo(() => {
    if (
      conicType === "parabola" &&
      result.isFocusChord &&
      result.intersections.length === 2
    ) {
      return result.intersections.map((pt) => ({
        from: mathToDesign(pt.x, pt.y, scale),
        to: mathToDesign(directrixX, pt.y, scale),
        footMath: { x: directrixX, y: pt.y },
      }));
    }
    return [];
  }, [conicType, result.isFocusChord, result.intersections, directrixX, scale]);

  // 5. 组装待避让的 Label 列表 (纯字母点标规范)
  const rawLabels = useMemo(() => {
    const raw: LabelItem[] = [
      {
        key: "O",
        x: originD.x,
        y: originD.y + 12,
        text: "O",
      },
      {
        key: "F1",
        x: focus1D.x,
        y: focus1D.y - 12,
        text: conicType === "parabola" ? "F" : "F₁",
      },
    ];
    if (focus2D) {
      raw.push({
        key: "F2",
        x: focus2D.x,
        y: focus2D.y - 12,
        text: "F₂",
      });
    }

    if (intersectionDesignPoints.length === 1) {
      raw.push({
        key: "T",
        x: intersectionDesignPoints[0].x,
        y: intersectionDesignPoints[0].y - 12,
        text: result.status === "tangent" ? "T" : "P₀",
      });
    } else if (intersectionDesignPoints.length === 2) {
      raw.push({
        key: "A",
        x: intersectionDesignPoints[0].x,
        y: intersectionDesignPoints[0].y - 12,
        text: "A",
      });
      raw.push({
        key: "B",
        x: intersectionDesignPoints[1].x,
        y: intersectionDesignPoints[1].y - 12,
        text: "B",
      });
    }

    if (projectionPoints.length === 2) {
      raw.push({
        key: "A_prime",
        x: projectionPoints[0].to.x - 12,
        y: projectionPoints[0].to.y,
        text: "A'",
      });
      raw.push({
        key: "B_prime",
        x: projectionPoints[1].to.x - 12,
        y: projectionPoints[1].to.y,
        text: "B'",
      });
    }

    if (midpointD && studyMode === "midpoint") {
      raw.push({
        key: "M",
        x: midpointD.x,
        y: midpointD.y + 14,
        text: result.isMidpointValid ? "M" : "M (曲线外)",
      });
    }

    if (studyMode === "polePolar") {
      const poleX = params.poleX ?? 4;
      const poleY = params.poleY ?? 3;
      const poleD = mathToDesign(poleX, poleY, scale);
      raw.push({
        key: "P",
        x: poleD.x + 12,
        y: poleD.y - 12,
        text: result.intersections.length === 2 ? "P" : "P (无切线)",
      });
    }

    return raw;
  }, [
    originD,
    focus1D,
    focus2D,
    intersectionDesignPoints,
    projectionPoints,
    midpointD,
    studyMode,
    conicType,
    result.status,
    result.isMidpointValid,
    result.intersections.length,
    params.poleX,
    params.poleY,
    scale,
  ]);

  const adjustedLabels = useMemo(
    () => avoidLabelOverlap(rawLabels, 16),
    [rawLabels],
  );

  // 6. 原点三角形 △OAB 填充路径 (仅在 general 位置与弦长模式展示，避免干扰焦点弦/中点弦/极线)
  const trianglePath = useMemo(() => {
    if (studyMode === "general" && intersectionDesignPoints.length === 2) {
      const [pA, pB] = intersectionDesignPoints;
      return `M ${originD.x} ${originD.y} L ${pA.x} ${pA.y} L ${pB.x} ${pB.y} Z`;
    }
    return "";
  }, [studyMode, originD, intersectionDesignPoints]);

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

  // 动点拖拽处理器 (防火墙 1：回调入参已经是数学坐标，严禁二次 designToMath)
  const handleMidpointDrag = (pt: Point2D) => {
    onParamChange("midpointX", Number(pt.x.toFixed(2)));
    onParamChange("midpointY", Number(pt.y.toFixed(2)));
  };

  const handlePoleDrag = (pt: Point2D) => {
    onParamChange("poleX", Number(pt.x.toFixed(2)));
    onParamChange("poleY", Number(pt.y.toFixed(2)));
  };

  return (
    <g>
      {/* 坐标轴与网格 (解析几何采用纯净坐标轴规范 showGrid={false}) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

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

      {/* 圆锥曲线主体渲染 */}
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
        <>
          <path
            d={parabolaPathD}
            fill="none"
            stroke={MATH_COLORS.primary}
            strokeWidth={2.5}
          />
          {/* 准线 x = -p/2 */}
          <line
            x1={directrixP1.x}
            y1={directrixP1.y}
            x2={directrixP2.x}
            y2={directrixP2.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.5}
            strokeDasharray="5,4"
          />
          <text
            x={directrixP1.x - 8}
            y={directrixP1.y + 15}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            textAnchor="end"
          >
            {`x = -${(p / 2).toFixed(1).replace(/\.0$/, "")}`}
          </text>
          {/* 焦点弦端点到准线的垂直投影特征线 */}
          {projectionPoints.map((proj, idx) => (
            <g key={`proj-${idx}`}>
              <line
                x1={proj.from.x}
                y1={proj.from.y}
                x2={proj.to.x}
                y2={proj.to.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.5}
                strokeDasharray="3,3"
              />
              <MathPoint
                x={proj.footMath.x}
                y={proj.footMath.y}
                scale={scale}
                color={MATH_COLORS.paramTertiary}
                fontScale={fontScale}
              />
            </g>
          ))}
        </>
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
      <MathPoint
        x={result.focusF1.x}
        y={result.focusF1.y}
        scale={scale}
        color={MATH_COLORS.accent}
        fontScale={fontScale}
      />
      {result.focusF2 && (
        <MathPoint
          x={result.focusF2.x}
          y={result.focusF2.y}
          scale={scale}
          color={MATH_COLORS.accent}
          fontScale={fontScale}
        />
      )}

      {/* 交点 A 与 B / 切点 T */}
      {result.intersections.map((pt, idx) => (
        <MathPoint
          key={`intersect-${idx}`}
          x={pt.x}
          y={pt.y}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />
      ))}

      {/* 极点极线模式：渲染切线 PA, PB 与可拖拽极点 P */}
      {studyMode === "polePolar" && (
        <g className="pole-polar-layer">
          {(() => {
            const poleX = params.poleX ?? 4;
            const poleY = params.poleY ?? 3;
            const poleD = mathToDesign(poleX, poleY, scale);

            return (
              <>
                {/* 切线 PA 与 PB */}
                {intersectionDesignPoints.map((pt, idx) => (
                  <line
                    key={`tangent-arm-${idx}`}
                    x1={poleD.x}
                    y1={poleD.y}
                    x2={pt.x}
                    y2={pt.y}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                ))}

                {/* 极点 P 交互点 */}
                <InteractivePoint
                  cx={poleX}
                  cy={poleY}
                  scale={scale}
                  vp={vp}
                  onDrag={handlePoleDrag}
                  color={MATH_COLORS.paramPrimary}
                  fontScale={fontScale}
                />
              </>
            );
          })()}
        </g>
      )}

      {/* 弦中点 M 可拖拽交互点 */}
      {studyMode === "midpoint" && (
        <InteractivePoint
          cx={params.midpointX ?? 1}
          cy={params.midpointY ?? 1}
          scale={scale}
          vp={vp}
          onDrag={handleMidpointDrag}
          color={MATH_COLORS.paramSecondary}
          fontScale={fontScale}
        />
      )}

      {/* 避让算法排布标注文本 (带白色微描边，杜绝白底遮挡与重影) */}
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
                  : lbl.key === "A_prime" || lbl.key === "B_prime"
                    ? MATH_COLORS.paramTertiary
                    : MATH_COLORS.paramPrimary
          }
          fontSize={fontScale(12)}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={3}
          strokeLinejoin="round"
        >
          {lbl.text}
        </text>
      ))}
    </g>
  );
};
