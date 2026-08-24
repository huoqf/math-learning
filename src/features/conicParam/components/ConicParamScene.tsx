import React, { useMemo } from "react";
import {
  CoordinateGrid,
  InteractivePoint,
  MathPoint,
  VectorArrow,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap, type LabelItem } from "@/utils/labelOverlap";
import {
  calculateLineConicParam,
  calculateEllipseParam,
} from "@/math/conicParam";
import type { ViewportInfo, SceneScale } from "@/hooks";

interface ConicParamSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (baseSize: number) => number;
  studyMode: "lineParam" | "ellipseParam" | "tSimplify";
}

export const ConicParamScene: React.FC<ConicParamSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}) => {
  const { a, b, x0, y0, alpha, theta, t } = params;

  // 1. 计算焦点坐标
  const c = Math.sqrt(Math.max(0, a * a - b * b));

  // 2. 计算直线与椭圆相关几何量
  const lineResult = useMemo(() => {
    return calculateLineConicParam(x0, y0, alpha, t, a, b);
  }, [x0, y0, alpha, t, a, b]);

  // 3. 计算椭圆参数点相关几何量
  const ellipseResult = useMemo(() => {
    return calculateEllipseParam(a, b, theta);
  }, [a, b, theta]);

  // 4. 坐标映射到 Design 空间
  const originD = useMemo(() => mathToDesign(0, 0, scale), [scale]);
  const f1D = useMemo(() => mathToDesign(c, 0, scale), [c, scale]);
  const f2D = useMemo(() => mathToDesign(-c, 0, scale), [c, scale]);
  const p0Design = useMemo(() => mathToDesign(x0, y0, scale), [x0, y0, scale]);
  const ptDesign = useMemo(
    () => mathToDesign(lineResult.Pt.x, lineResult.Pt.y, scale),
    [lineResult.Pt, scale],
  );
  const paDesign = useMemo(
    () => mathToDesign(lineResult.pointA.x, lineResult.pointA.y, scale),
    [lineResult.pointA, scale],
  );
  const pbDesign = useMemo(
    () => mathToDesign(lineResult.pointB.x, lineResult.pointB.y, scale),
    [lineResult.pointB, scale],
  );
  const pmDesign = useMemo(
    () => mathToDesign(lineResult.pointM.x, lineResult.pointM.y, scale),
    [lineResult.pointM, scale],
  );
  const pParamDesign = useMemo(
    () => mathToDesign(ellipseResult.P.x, ellipseResult.P.y, scale),
    [ellipseResult.P, scale],
  );
  const pAuxDesign = useMemo(
    () => mathToDesign(ellipseResult.Paux.x, ellipseResult.Paux.y, scale),
    [ellipseResult.Paux, scale],
  );

  // 5. 离心圆与内切圆
  const auxCircleDesign = useMemo(() => {
    const { x: cx, y: cy } = mathToDesign(0, 0, scale);
    return { cx, cy, rx: a * scale.scaleX, ry: a * scale.scaleY };
  }, [a, scale]);

  const inCircleDesign = useMemo(() => {
    const { x: cx, y: cy } = mathToDesign(0, 0, scale);
    return { cx, cy, rx: b * scale.scaleX, ry: b * scale.scaleY };
  }, [b, scale]);

  // 6. 直线采样线段 (全程延伸)
  const lineSegmentPath = useMemo(() => {
    const rad = lineResult.alphaRad;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const R = 15; // 延伸长度
    const pStart = mathToDesign(x0 - R * cosA, y0 - R * sinA, scale);
    const pEnd = mathToDesign(x0 + R * cosA, y0 + R * sinA, scale);
    return `M ${pStart.x} ${pStart.y} L ${pEnd.x} ${pEnd.y}`;
  }, [x0, y0, lineResult.alphaRad, scale]);

  // 7. 组装符合高中数学习惯的纯字母点标
  const rawLabels = useMemo<LabelItem[]>(() => {
    const labels: LabelItem[] = [
      { key: "O", x: originD.x, y: originD.y + 12, text: "O" },
      { key: "F1", x: f1D.x, y: f1D.y - 12, text: "F₁" },
      { key: "F2", x: f2D.x, y: f2D.y - 12, text: "F₂" },
    ];

    if (studyMode === "ellipseParam") {
      labels.push({
        key: "P",
        x: pParamDesign.x,
        y: pParamDesign.y - 12,
        text: "P",
      });
      labels.push({
        key: "Paux",
        x: pAuxDesign.x,
        y: pAuxDesign.y - 12,
        text: "P'",
      });
    } else {
      labels.push({
        key: "P0",
        x: p0Design.x,
        y: p0Design.y - 12,
        text: "P₀",
      });

      if (lineResult.valid) {
        labels.push({
          key: "A",
          x: paDesign.x,
          y: paDesign.y - 12,
          text: "A",
        });
        labels.push({
          key: "B",
          x: pbDesign.x,
          y: pbDesign.y - 12,
          text: "B",
        });
        labels.push({
          key: "M",
          x: pmDesign.x,
          y: pmDesign.y + 14,
          text: "M",
        });
      }

      if (studyMode === "lineParam" && Math.abs(t) > 0.1) {
        labels.push({
          key: "Pt",
          x: ptDesign.x,
          y: ptDesign.y - 12,
          text: "P",
        });
      }
    }

    return labels;
  }, [
    originD,
    f1D,
    f2D,
    studyMode,
    pParamDesign,
    pAuxDesign,
    p0Design,
    paDesign,
    pbDesign,
    pmDesign,
    ptDesign,
    lineResult.valid,
    t,
  ]);

  const placedLabels = useMemo(
    () => avoidLabelOverlap(rawLabels, 16),
    [rawLabels],
  );

  return (
    <g>
      {/* 1. 直角坐标系 (纯净主轴) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 2. 椭圆主曲线 */}
      <ellipse
        cx={originD.x}
        cy={originD.y}
        rx={a * scale.scaleX}
        ry={b * scale.scaleY}
        fill={withAlpha(MATH_COLORS.ellipse, 0.06)}
        stroke={MATH_COLORS.ellipse}
        strokeWidth={2.5}
      />

      {/* 3. 焦点 F1, F2 */}
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

      {/* Mode 2: 椭圆参数方程与离心辅助圆 */}
      {studyMode === "ellipseParam" && (
        <>
          {/* 辅助离心圆 (半径 a) */}
          <ellipse
            cx={auxCircleDesign.cx}
            cy={auxCircleDesign.cy}
            rx={auxCircleDesign.rx}
            ry={auxCircleDesign.ry}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          {/* 内切圆 (半径 b) */}
          <ellipse
            cx={inCircleDesign.cx}
            cy={inCircleDesign.cy}
            rx={inCircleDesign.rx}
            ry={inCircleDesign.ry}
            fill="none"
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* 原点 O 到离心圆点 P' 的射线 */}
          <line
            x1={originD.x}
            y1={originD.y}
            x2={pAuxDesign.x}
            y2={pAuxDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
          />

          {/* 垂直投影虚线 P' -> P */}
          <line
            x1={pAuxDesign.x}
            y1={pAuxDesign.y}
            x2={pParamDesign.x}
            y2={pParamDesign.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* 离心圆点 P' */}
          <MathPoint
            x={ellipseResult.Paux.x}
            y={ellipseResult.Paux.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />

          {/* 椭圆切线 (若有效) */}
          {isFinite(ellipseResult.interceptX) && (
            <line
              x1={mathToDesign(ellipseResult.interceptX, 0, scale).x}
              y1={mathToDesign(ellipseResult.interceptX, 0, scale).y}
              x2={mathToDesign(0, ellipseResult.interceptY, scale).x}
              y2={mathToDesign(0, ellipseResult.interceptY, scale).y}
              stroke={MATH_COLORS.tangentLine}
              strokeWidth={2}
            />
          )}

          {/* 椭圆动点 P(a cosθ, b sinθ) 可拖拽 */}
          <InteractivePoint
            cx={ellipseResult.P.x}
            cy={ellipseResult.P.y}
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

      {/* Mode 1 & Mode 3: 直线参数方程与交点 */}
      {(studyMode === "lineParam" || studyMode === "tSimplify") && (
        <>
          {/* 直线 l */}
          <path
            d={lineSegmentPath}
            stroke={withAlpha(MATH_COLORS.line, 0.6)}
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />

          {/* 割线交点 A, B 与相交弦加厚高亮 */}
          {lineResult.valid && (
            <>
              <line
                x1={paDesign.x}
                y1={paDesign.y}
                x2={pbDesign.x}
                y2={pbDesign.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={3.5}
              />
              <MathPoint
                x={lineResult.pointA.x}
                y={lineResult.pointA.y}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                fontScale={fontScale}
              />
              <MathPoint
                x={lineResult.pointB.x}
                y={lineResult.pointB.y}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                fontScale={fontScale}
              />

              {/* 弦中点 M */}
              <MathPoint
                x={lineResult.pointM.x}
                y={lineResult.pointM.y}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                fontScale={fontScale}
              />
            </>
          )}

          {/* 定点 P0 到动点 P(t) 的方向向量 P0P */}
          {studyMode === "lineParam" && Math.abs(t) > 0.1 && (
            <>
              <VectorArrow
                from={[x0, y0]}
                to={[lineResult.Pt.x, lineResult.Pt.y]}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                strokeWidth={2.5}
                fontScale={fontScale}
              />
              <InteractivePoint
                cx={lineResult.Pt.x}
                cy={lineResult.Pt.y}
                scale={scale}
                vp={vp}
                color={MATH_COLORS.paramSecondary}
                fontScale={fontScale}
                onDrag={({ x, y }) => {
                  const rad = lineResult.alphaRad;
                  const projT =
                    (x - x0) * Math.cos(rad) + (y - y0) * Math.sin(rad);
                  onParamChange("t", Number(projT.toFixed(1)));
                }}
              />
            </>
          )}

          {/* 定点 P0(x0, y0) 可拖拽 */}
          <InteractivePoint
            cx={x0}
            cy={y0}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            onDrag={({ x, y }) => {
              onParamChange("x0", Number(x.toFixed(1)));
              onParamChange("y0", Number(y.toFixed(1)));
            }}
          />
        </>
      )}

      {/* 4. 渲染纯字母标签 (带白色微描边防遮挡) */}
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
                : lbl.key === "F1" || lbl.key === "F2"
                  ? MATH_COLORS.accent
                  : lbl.key === "M"
                    ? MATH_COLORS.paramSecondary
                    : lbl.key === "P0"
                      ? MATH_COLORS.paramPrimary
                      : MATH_COLORS.paramPrimary
            }
            textAnchor="middle"
            dominantBaseline="central"
            paintOrder="stroke"
            stroke="white"
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
