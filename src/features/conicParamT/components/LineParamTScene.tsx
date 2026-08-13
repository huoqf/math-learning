import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  VectorArrow,
  FunctionGraph,
} from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap, type LabelItem } from "@/utils/labelOverlap";
import {
  calcLineConicIntersection,
  getLinePoint,
  getNonStandardLinePoint,
  type ConicType,
} from "@/math/lineParamT";

export interface LineParamTSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale?: (size: number) => number;
  onParamChange: (key: string, val: number) => void;
  mode: "definition" | "secant" | "gaokao";
  conicType: ConicType;
  gaokaoModel?: "midpoint" | "product" | "reciprocal";
}

export const LineParamTScene: React.FC<LineParamTSceneProps> = ({
  params,
  scale,
  vp,
  fontScale = (v) => v,
  onParamChange,
  mode,
  conicType,
  gaokaoModel = "midpoint",
}) => {
  const { x0, y0, alpha, t, kNorm, R, a, b, p } = params;

  // 1. 直线方向向量 e = (cosα, sinα)
  const rad = (alpha * Math.PI) / 180;
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);

  // 2. 定点 P0 与 动点 P 坐标
  const ptP0 = useMemo(() => ({ x: x0, y: y0 }), [x0, y0]);
  const ptP = useMemo(() => getLinePoint(x0, y0, alpha, t), [x0, y0, alpha, t]);
  const ptPNon = useMemo(
    () => getNonStandardLinePoint(x0, y0, alpha, t, kNorm),
    [x0, y0, alpha, t, kNorm],
  );

  // 3. 各种相交情况求解
  const intersect = useMemo(
    () =>
      calcLineConicIntersection(x0, y0, alpha, conicType, {
        R,
        a,
        b,
        p,
      }),
    [x0, y0, alpha, conicType, R, a, b, p],
  );

  // 4. 坐标映射到 Design 空间
  const desP0 = mathToDesign(ptP0.x, ptP0.y, scale);
  const desP = mathToDesign(ptP.x, ptP.y, scale);
  const desPNon = mathToDesign(ptPNon.x, ptPNon.y, scale);

  // 直线延伸端点 (t = -12 ~ +12)
  const desLineStart = mathToDesign(x0 - 12 * dirX, y0 - 12 * dirY, scale);
  const desLineEnd = mathToDesign(x0 + 12 * dirX, y0 + 12 * dirY, scale);

  // 5. 组装待避让的 Label 列表 (Design 坐标)
  const rawLabels = useMemo<LabelItem[]>(() => {
    const labels: LabelItem[] = [
      {
        key: "P0",
        x: desP0.x,
        y: desP0.y - 12,
        text: `P₀(${x0.toFixed(1)}, ${y0.toFixed(1)})`,
      },
    ];

    if (mode === "definition") {
      labels.push({
        key: "P",
        x: desP.x,
        y: desP.y - 12,
        text: `P(t=${t.toFixed(1)})`,
      });
      if (Math.abs(kNorm - 1.0) > 1e-2) {
        labels.push({
          key: "PNon",
          x: desPNon.x,
          y: desPNon.y + 16,
          text: `P'(m=${t.toFixed(1)})`,
        });
      }
    } else if (intersect.hasIntersection) {
      if (intersect.pointA) {
        const desA = mathToDesign(
          intersect.pointA.x,
          intersect.pointA.y,
          scale,
        );
        labels.push({
          key: "A",
          x: desA.x,
          y: desA.y - 12,
          text: `A(t₁=${intersect.t1.toFixed(2)})`,
        });
      }
      if (intersect.pointB) {
        const desB = mathToDesign(
          intersect.pointB.x,
          intersect.pointB.y,
          scale,
        );
        labels.push({
          key: "B",
          x: desB.x,
          y: desB.y - 12,
          text: `B(t₂=${intersect.t2.toFixed(2)})`,
        });
      }
      if (intersect.pointM) {
        const desM = mathToDesign(
          intersect.pointM.x,
          intersect.pointM.y,
          scale,
        );
        labels.push({
          key: "M",
          x: desM.x,
          y: desM.y + 14,
          text: `M(中点)`,
        });
      }
    }
    return labels;
  }, [desP0, desP, desPNon, mode, kNorm, t, intersect, scale, x0, y0]);

  const adjustedLabels = useMemo(
    () => avoidLabelOverlap(rawLabels, 16),
    [rawLabels],
  );

  // 6. 二次曲线色彩与精准路径渲染 (参数化生成，解决坐标轴顶点断裂不显问题)
  const conicColor =
    conicType === "circle"
      ? MATH_COLORS.circle
      : conicType === "ellipse"
        ? MATH_COLORS.ellipse
        : conicType === "hyperbola"
          ? MATH_COLORS.hyperbola
          : MATH_COLORS.parabola;

  // 原点 Design 坐标与轴半径
  const originDesign = mathToDesign(0, 0, scale);

  // 抛物线 path: 以 y 轴为参数 [-9, 9] 采样 x = y^2 / (2p)
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
      {/* 坐标网格与坐标轴 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 割线与高考模式下的二次曲线渲染 */}
      {mode !== "definition" && (
        <>
          {/* 圆形：使用 SVG 原生 <ellipse> 零缝隙封闭曲线 */}
          {conicType === "circle" && (
            <ellipse
              cx={originDesign.x}
              cy={originDesign.y}
              rx={R * scale.scaleX}
              ry={R * scale.scaleY}
              fill="none"
              stroke={conicColor}
              strokeWidth={2.5}
            />
          )}

          {/* 椭圆：使用 SVG 原生 <ellipse> 4个坐标轴顶点 100% 圆滑显现 */}
          {conicType === "ellipse" && (
            <ellipse
              cx={originDesign.x}
              cy={originDesign.y}
              rx={a * scale.scaleX}
              ry={b * scale.scaleY}
              fill="none"
              stroke={conicColor}
              strokeWidth={2.5}
            />
          )}

          {/* 抛物线：y 参数化连续 Path，顶点在原点 (0,0) 完美连续 */}
          {conicType === "parabola" && (
            <path
              d={parabolaPathD}
              fill="none"
              stroke={conicColor}
              strokeWidth={2.5}
            />
          )}

          {/* 双曲线：y 参数化连续 Path，左右顶点 (±a,0) 完美过轴显现 */}
          {conicType === "hyperbola" && (
            <>
              <path
                d={hyperbolaRightPathD}
                fill="none"
                stroke={conicColor}
                strokeWidth={2.5}
              />
              <path
                d={hyperbolaLeftPathD}
                fill="none"
                stroke={conicColor}
                strokeWidth={2.5}
              />
            </>
          )}
        </>
      )}

      {/* 渐近线 (双曲线时显示) */}
      {mode !== "definition" && conicType === "hyperbola" && (
        <>
          <FunctionGraph
            fn={(x) => (b / a) * x}
            scale={scale}
            color={CANVAS_COLORS.gridSubtle}
            strokeDasharray="4,4"
            strokeWidth={1.5}
          />
          <FunctionGraph
            fn={(x) => -(b / a) * x}
            scale={scale}
            color={CANVAS_COLORS.gridSubtle}
            strokeDasharray="4,4"
            strokeWidth={1.5}
          />
        </>
      )}

      {/* 直线 l */}
      <line
        x1={desLineStart.x}
        y1={desLineStart.y}
        x2={desLineEnd.x}
        y2={desLineEnd.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2}
        strokeDasharray="6,4"
      />

      {/* 直线方向单位向量 e */}
      <VectorArrow
        from={[ptP0.x, ptP0.y]}
        to={[x0 + 1.2 * dirX, y0 + 1.2 * dirY]}
        scale={scale}
        color={MATH_COLORS.vectorPrimary}
        strokeWidth={2.5}
        label="e⃗"
        fontScale={fontScale}
      />

      {/* Mode 1: 演示标准 t 与非标准 m 距离线段 */}
      {mode === "definition" && (
        <>
          {/* 标准有向线段 P0 -> P */}
          <line
            x1={desP0.x}
            y1={desP0.y}
            x2={desP.x}
            y2={desP.y}
            stroke={MATH_COLORS.function}
            strokeWidth={4}
          />
          {/* 非标准点与连线 */}
          {Math.abs(kNorm - 1.0) > 1e-2 && (
            <line
              x1={desP0.x}
              y1={desP0.y}
              x2={desPNon.x}
              y2={desPNon.y}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={2.5}
              strokeDasharray="3,3"
            />
          )}

          {/* 动点 P 拖拽 */}
          <InteractivePoint
            cx={ptP.x}
            cy={ptP.y}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.function}
            r={7}
            fontScale={fontScale}
            onDrag={(mathPt) => {
              // 投影反算 t 值
              const projT = (mathPt.x - x0) * dirX + (mathPt.y - y0) * dirY;
              onParamChange("t", Number(projT.toFixed(2)));
            }}
          />

          {/* 非标准点 P' 标注 */}
          {Math.abs(kNorm - 1.0) > 1e-2 && (
            <circle
              cx={desPNon.x}
              cy={desPNon.y}
              r={5}
              fill={MATH_COLORS.paramSecondary}
            />
          )}
        </>
      )}

      {/* Mode 2 & 3: 割线交点 A, B 与 弦中点 M */}
      {mode !== "definition" && intersect.hasIntersection && (
        <>
          {/* 弦线段 AB 高亮 */}
          {intersect.pointA && intersect.pointB && (
            <line
              x1={mathToDesign(intersect.pointA.x, intersect.pointA.y, scale).x}
              y1={mathToDesign(intersect.pointA.x, intersect.pointA.y, scale).y}
              x2={mathToDesign(intersect.pointB.x, intersect.pointB.y, scale).x}
              y2={mathToDesign(intersect.pointB.x, intersect.pointB.y, scale).y}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={4.5}
            />
          )}

          {/* 交点 A */}
          {intersect.pointA && (
            <InteractivePoint
              cx={intersect.pointA.x}
              cy={intersect.pointA.y}
              scale={scale}
              vp={vp}
              color={MATH_COLORS.paramSecondary}
              r={6}
              fontScale={fontScale}
              onDrag={() => {}}
            />
          )}

          {/* 交点 B */}
          {intersect.pointB && (
            <InteractivePoint
              cx={intersect.pointB.x}
              cy={intersect.pointB.y}
              scale={scale}
              vp={vp}
              color={MATH_COLORS.paramSecondary}
              r={6}
              fontScale={fontScale}
              onDrag={() => {}}
            />
          )}

          {/* 弦中点 M */}
          {intersect.pointM && (
            <circle
              cx={mathToDesign(intersect.pointM.x, intersect.pointM.y, scale).x}
              cy={mathToDesign(intersect.pointM.x, intersect.pointM.y, scale).y}
              r={mode === "gaokao" && gaokaoModel === "midpoint" ? 7 : 5}
              fill={
                mode === "gaokao" && gaokaoModel === "midpoint"
                  ? MATH_COLORS.paramPrimary
                  : MATH_COLORS.paramTertiary
              }
            />
          )}
        </>
      )}

      {/* 可拖拽定点 P0 */}
      <InteractivePoint
        cx={ptP0.x}
        cy={ptP0.y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        r={8}
        fontScale={fontScale}
        onDrag={(mathPt) => {
          onParamChange("x0", Number(mathPt.x.toFixed(2)));
          onParamChange("y0", Number(mathPt.y.toFixed(2)));
        }}
      />

      {/* SVG 内标注 (使用避让算法排布) */}
      {adjustedLabels.map((lbl) => (
        <text
          key={lbl.key}
          x={lbl.x}
          y={lbl.y + (lbl.finalDy ?? 0)}
          fill={
            lbl.key === "P0"
              ? MATH_COLORS.paramPrimary
              : lbl.key === "P"
                ? MATH_COLORS.function
                : lbl.key === "PNon"
                  ? MATH_COLORS.paramSecondary
                  : lbl.key === "M"
                    ? MATH_COLORS.paramTertiary
                    : MATH_COLORS.paramSecondary
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
