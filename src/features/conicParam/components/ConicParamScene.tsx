import React, { useMemo } from "react";
import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap, type LabelItem } from "@/utils/labelOverlap";
import {
  calculateEllipseParam,
  calculateParabolaYParam,
  calculateLineYFormConic,
} from "@/math/conicParam";
import type { ViewportInfo, SceneScale } from "@/hooks";

interface ConicParamSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (baseSize: number) => number;
  studyMode: "ellipseTrig" | "parabolaYParam" | "lineYForm";
}

export const ConicParamScene: React.FC<ConicParamSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}) => {
  const {
    a = 4,
    b = 3,
    theta = 45,
    p = 2,
    y1 = 3,
    y2 = -1.5,
    m = 0.8,
    n = 1,
  } = params;

  // 1. 坐标原点
  const originD = useMemo(() => mathToDesign(0, 0, scale), [scale]);

  // 2. 模式 1 数据 (椭圆三角代换)
  const ellipseRes = useMemo(() => {
    return calculateEllipseParam(a, b, theta, { A: 1, B: -1, C: -6 });
  }, [a, b, theta]);

  const c = Math.sqrt(Math.max(0, a * a - b * b));
  const f1D = useMemo(() => mathToDesign(c, 0, scale), [c, scale]);
  const f2D = useMemo(() => mathToDesign(-c, 0, scale), [c, scale]);

  // 3. 模式 2 数据 (抛物线纵坐标单参数)
  const parabolaRes = useMemo(() => {
    return calculateParabolaYParam(p, y1, y2);
  }, [p, y1, y2]);

  // 4. 模式 3 数据 (设线降维 x = my + n)
  const lineYRes = useMemo(() => {
    return calculateLineYFormConic(a, b, m, n);
  }, [a, b, m, n]);

  // -------------------------------------------------------------
  // 点标签计算与防重叠
  // -------------------------------------------------------------
  const rawLabels = useMemo<LabelItem[]>(() => {
    const labels: LabelItem[] = [
      { key: "O", x: originD.x, y: originD.y + 12, text: "O" },
    ];

    if (studyMode === "ellipseTrig") {
      labels.push(
        { key: "F1", x: f1D.x, y: f1D.y - 12, text: "F₁" },
        { key: "F2", x: f2D.x, y: f2D.y - 12, text: "F₂" },
      );
      const pD = mathToDesign(ellipseRes.P.x, ellipseRes.P.y, scale);
      labels.push({ key: "P", x: pD.x, y: pD.y - 12, text: "P" });
      const pAuxD = mathToDesign(ellipseRes.Paux.x, ellipseRes.Paux.y, scale);
      labels.push({ key: "Paux", x: pAuxD.x, y: pAuxD.y - 12, text: "P'" });
    } else if (studyMode === "parabolaYParam") {
      const focusD = mathToDesign(p / 2, 0, scale);
      labels.push({ key: "F", x: focusD.x, y: focusD.y - 12, text: "F" });
      const aD = mathToDesign(
        parabolaRes.pointA.x,
        parabolaRes.pointA.y,
        scale,
      );
      labels.push({ key: "A", x: aD.x, y: aD.y - 12, text: "A" });
      const bD = mathToDesign(
        parabolaRes.pointB.x,
        parabolaRes.pointB.y,
        scale,
      );
      labels.push({ key: "B", x: bD.x, y: bD.y - 12, text: "B" });
      const mD = mathToDesign(
        parabolaRes.pointM.x,
        parabolaRes.pointM.y,
        scale,
      );
      labels.push({ key: "M", x: mD.x, y: mD.y + 14, text: "M" });
    } else {
      labels.push(
        { key: "F1", x: f1D.x, y: f1D.y - 12, text: "F₁" },
        { key: "F2", x: f2D.x, y: f2D.y - 12, text: "F₂" },
      );
      if (lineYRes.valid) {
        const aD = mathToDesign(lineYRes.pointA.x, lineYRes.pointA.y, scale);
        labels.push({ key: "A", x: aD.x, y: aD.y - 12, text: "A" });
        const bD = mathToDesign(lineYRes.pointB.x, lineYRes.pointB.y, scale);
        labels.push({ key: "B", x: bD.x, y: bD.y - 12, text: "B" });
        const mD = mathToDesign(lineYRes.pointM.x, lineYRes.pointM.y, scale);
        labels.push({ key: "M", x: mD.x, y: mD.y + 14, text: "M" });
      }
    }

    return labels;
  }, [
    originD,
    studyMode,
    f1D,
    f2D,
    ellipseRes,
    scale,
    p,
    parabolaRes,
    lineYRes,
  ]);

  const placedLabels = useMemo(
    () => avoidLabelOverlap(rawLabels, 16),
    [rawLabels],
  );

  // 抛物线采样路径 (x in [0, 8])
  const parabolaPath = useMemo(() => {
    if (p <= 0) return "";
    const ptsTop: string[] = [];
    const ptsBottom: string[] = [];
    for (let x = 0; x <= 8; x += 0.15) {
      const y = Math.sqrt(2 * p * x);
      const dTop = mathToDesign(x, y, scale);
      const dBottom = mathToDesign(x, -y, scale);
      ptsTop.push(`${x === 0 ? "M" : "L"} ${dTop.x} ${dTop.y}`);
      ptsBottom.push(`L ${dBottom.x} ${dBottom.y}`);
    }
    ptsBottom.reverse();
    return `${ptsTop.join(" ")} ${ptsBottom.join(" ")}`;
  }, [p, scale]);

  return (
    <g>
      {/* 1. 直角坐标系 (纯净主轴) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* ------------------------------------------------------------- */}
      {/* 模式 1: 椭圆三角代换与辅助圆场景 */}
      {/* ------------------------------------------------------------- */}
      {studyMode === "ellipseTrig" && (
        <>
          {/* 椭圆主曲线 */}
          <ellipse
            cx={originD.x}
            cy={originD.y}
            rx={a * scale.scaleX}
            ry={b * scale.scaleY}
            fill={withAlpha(MATH_COLORS.ellipse, 0.06)}
            stroke={MATH_COLORS.ellipse}
            strokeWidth={2.5}
          />

          {/* 焦点 F1, F2 */}
          <MathPoint
            x={c}
            y={0}
            scale={scale}
            color={MATH_COLORS.accent}
            fontScale={fontScale}
          />
          <MathPoint
            x={-c}
            y={0}
            scale={scale}
            color={MATH_COLORS.accent}
            fontScale={fontScale}
          />

          {/* 辅助离心圆 (半径 a) */}
          <ellipse
            cx={originD.x}
            cy={originD.y}
            rx={a * scale.scaleX}
            ry={a * scale.scaleY}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* 原点 O 到离心圆点 P' 的射线 */}
          <line
            x1={originD.x}
            y1={originD.y}
            x2={mathToDesign(ellipseRes.Paux.x, ellipseRes.Paux.y, scale).x}
            y2={mathToDesign(ellipseRes.Paux.x, ellipseRes.Paux.y, scale).y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
          />

          {/* 垂直投影虚线 P' -> P */}
          <line
            x1={mathToDesign(ellipseRes.Paux.x, ellipseRes.Paux.y, scale).x}
            y1={mathToDesign(ellipseRes.Paux.x, ellipseRes.Paux.y, scale).y}
            x2={mathToDesign(ellipseRes.P.x, ellipseRes.P.y, scale).x}
            y2={mathToDesign(ellipseRes.P.x, ellipseRes.P.y, scale).y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* 离心圆对应点 P' */}
          <MathPoint
            x={ellipseRes.Paux.x}
            y={ellipseRes.Paux.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />

          {/* 椭圆切线 (若有效) */}
          {isFinite(ellipseRes.interceptX) && (
            <line
              x1={mathToDesign(ellipseRes.interceptX, 0, scale).x}
              y1={mathToDesign(ellipseRes.interceptX, 0, scale).y}
              x2={mathToDesign(0, ellipseRes.interceptY, scale).x}
              y2={mathToDesign(0, ellipseRes.interceptY, scale).y}
              stroke={MATH_COLORS.tangentLine}
              strokeWidth={2}
            />
          )}

          {/* 椭圆动点 P(a cosθ, b sinθ) 可拖拽 */}
          <InteractivePoint
            cx={ellipseRes.P.x}
            cy={ellipseRes.P.y}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            onDrag={({ x, y }) => {
              let rad = Math.atan2(y / b, x / a);
              if (rad < 0) rad += 2 * Math.PI;
              const deg = Math.round((rad * 180) / Math.PI);
              onParamChange("theta", deg);
            }}
          />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 模式 2: 抛物线纵坐标单参数设点场景 */}
      {/* ------------------------------------------------------------- */}
      {studyMode === "parabolaYParam" && (
        <>
          {/* 准线 x = -p/2 */}
          <line
            x1={mathToDesign(-p / 2, scale.yMin, scale).x}
            y1={mathToDesign(-p / 2, scale.yMin, scale).y}
            x2={mathToDesign(-p / 2, scale.yMax, scale).x}
            y2={mathToDesign(-p / 2, scale.yMax, scale).y}
            stroke={withAlpha(MATH_COLORS.textMuted, 0.4)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* 抛物线主曲线 */}
          <path
            d={parabolaPath}
            fill="none"
            stroke={MATH_COLORS.parabola}
            strokeWidth={2.5}
          />

          {/* 焦点 F(p/2, 0) */}
          <MathPoint
            x={p / 2}
            y={0}
            scale={scale}
            color={MATH_COLORS.accent}
            fontScale={fontScale}
          />

          {/* 割线延长虚线 */}
          {(() => {
            const dy = y2 - y1;
            const dx = parabolaRes.pointB.x - parabolaRes.pointA.x;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1e-4) return null;
            const ux = dx / len;
            const uy = dy / len;
            const pStart = mathToDesign(
              parabolaRes.pointA.x - 5 * ux,
              parabolaRes.pointA.y - 5 * uy,
              scale,
            );
            const pEnd = mathToDesign(
              parabolaRes.pointB.x + 5 * ux,
              parabolaRes.pointB.y + 5 * uy,
              scale,
            );
            return (
              <line
                x1={pStart.x}
                y1={pStart.y}
                x2={pEnd.x}
                y2={pEnd.y}
                stroke={withAlpha(MATH_COLORS.line, 0.4)}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            );
          })()}

          {/* 相交弦加厚实体 */}
          <line
            x1={
              mathToDesign(parabolaRes.pointA.x, parabolaRes.pointA.y, scale).x
            }
            y1={
              mathToDesign(parabolaRes.pointA.x, parabolaRes.pointA.y, scale).y
            }
            x2={
              mathToDesign(parabolaRes.pointB.x, parabolaRes.pointB.y, scale).x
            }
            y2={
              mathToDesign(parabolaRes.pointB.x, parabolaRes.pointB.y, scale).y
            }
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={3}
          />

          {/* 弦中点 M */}
          <MathPoint
            x={parabolaRes.pointM.x}
            y={parabolaRes.pointM.y}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
          />

          {/* 动点 A 可沿抛物线纵坐标拖拽 */}
          <InteractivePoint
            cx={parabolaRes.pointA.x}
            cy={parabolaRes.pointA.y}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            onDrag={({ y }) => {
              const clampedY = Math.max(-5, Math.min(5, y));
              onParamChange("y1", Number(clampedY.toFixed(1)));
            }}
          />

          {/* 动点 B 可沿抛物线纵坐标拖拽 */}
          <InteractivePoint
            cx={parabolaRes.pointB.x}
            cy={parabolaRes.pointB.y}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
            onDrag={({ y }) => {
              const clampedY = Math.max(-5, Math.min(5, y));
              onParamChange("y2", Number(clampedY.toFixed(1)));
            }}
          />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 模式 3: 设线降维 x = my + n 场景 */}
      {/* ------------------------------------------------------------- */}
      {studyMode === "lineYForm" && (
        <>
          {/* 椭圆主曲线 */}
          <ellipse
            cx={originD.x}
            cy={originD.y}
            rx={a * scale.scaleX}
            ry={b * scale.scaleY}
            fill={withAlpha(MATH_COLORS.ellipse, 0.06)}
            stroke={MATH_COLORS.ellipse}
            strokeWidth={2.5}
          />

          {/* 焦点 F1, F2 */}
          <MathPoint
            x={c}
            y={0}
            scale={scale}
            color={MATH_COLORS.accent}
            fontScale={fontScale}
          />
          <MathPoint
            x={-c}
            y={0}
            scale={scale}
            color={MATH_COLORS.accent}
            fontScale={fontScale}
          />

          {/* 割线 x = my + n 全局延长采样 */}
          {(() => {
            const yTop = 6;
            const yBottom = -6;
            const p1 = mathToDesign(m * yTop + n, yTop, scale);
            const p2 = mathToDesign(m * yBottom + n, yBottom, scale);
            return (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={withAlpha(MATH_COLORS.line, 0.5)}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            );
          })()}

          {/* 若有相交弦，渲染原点三角形 △OAB 填充与弦线段 */}
          {lineYRes.valid && (
            <>
              {/* 原点三角形填充 */}
              <polygon
                points={`
                  ${originD.x},${originD.y} 
                  ${mathToDesign(lineYRes.pointA.x, lineYRes.pointA.y, scale).x},${mathToDesign(lineYRes.pointA.x, lineYRes.pointA.y, scale).y} 
                  ${mathToDesign(lineYRes.pointB.x, lineYRes.pointB.y, scale).x},${mathToDesign(lineYRes.pointB.x, lineYRes.pointB.y, scale).y}
                `}
                fill={withAlpha(MATH_COLORS.accent, 0.12)}
                stroke={withAlpha(MATH_COLORS.accent, 0.4)}
                strokeWidth={1}
              />

              {/* 相交弦 AB */}
              <line
                x1={mathToDesign(lineYRes.pointA.x, lineYRes.pointA.y, scale).x}
                y1={mathToDesign(lineYRes.pointA.x, lineYRes.pointA.y, scale).y}
                x2={mathToDesign(lineYRes.pointB.x, lineYRes.pointB.y, scale).x}
                y2={mathToDesign(lineYRes.pointB.x, lineYRes.pointB.y, scale).y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={3}
              />

              {/* 交点 A, B */}
              <MathPoint
                x={lineYRes.pointA.x}
                y={lineYRes.pointA.y}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                fontScale={fontScale}
              />
              <MathPoint
                x={lineYRes.pointB.x}
                y={lineYRes.pointB.y}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                fontScale={fontScale}
              />

              {/* 弦中点 M */}
              <MathPoint
                x={lineYRes.pointM.x}
                y={lineYRes.pointM.y}
                scale={scale}
                color={MATH_COLORS.paramTertiary}
                fontScale={fontScale}
              />
            </>
          )}

          {/* 割线横截距点 (n, 0) 可拖拽调整 n */}
          <InteractivePoint
            cx={n}
            cy={0}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            onDrag={({ x }) => {
              const clampedN = Math.max(-5, Math.min(5, x));
              onParamChange("n", Number(clampedN.toFixed(1)));
            }}
          />
        </>
      )}

      {/* 5. 渲染防遮挡纯学术点标 */}
      {placedLabels.map((lbl) => {
        return (
          <text
            key={lbl.key}
            x={lbl.x}
            y={lbl.y + (lbl.finalDy ?? 0)}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={
              lbl.key === "O"
                ? MATH_COLORS.line
                : lbl.key === "F" || lbl.key === "F1" || lbl.key === "F2"
                  ? MATH_COLORS.accent
                  : lbl.key === "M"
                    ? MATH_COLORS.paramTertiary
                    : MATH_COLORS.paramPrimary
            }
            textAnchor="middle"
            dominantBaseline="central"
            paintOrder="stroke"
            stroke={MATH_COLORS.white}
            strokeWidth={3}
            strokeLinejoin="round"
            className="select-none pointer-events-none"
          >
            {lbl.text}
          </text>
        );
      })}
    </g>
  );
};
