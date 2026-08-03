import React, { useMemo } from "react";
import {
  CoordinateGrid,
  InteractivePoint,
  VectorArrow,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import {
  calculateLineConicParam,
  calculateEllipseParam,
} from "@/math/conicParam";
import type { ViewportInfo, SceneScale } from "@/hooks";

interface ConicParamSceneProps {
  params: {
    a: number;
    b: number;
    x0: number;
    y0: number;
    alpha: number;
    theta: number;
    t: number;
  };
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

  // 计算直线与椭圆相关几何量
  const lineResult = useMemo(() => {
    return calculateLineConicParam(x0, y0, alpha, t, a, b);
  }, [x0, y0, alpha, t, a, b]);

  // 计算椭圆参数点相关几何量
  const ellipseResult = useMemo(() => {
    return calculateEllipseParam(a, b, theta);
  }, [a, b, theta]);

  // 椭圆采样路径 (SVG <path>)
  const ellipsePath = useMemo(() => {
    const points: string[] = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const angle = (i / N) * 2 * Math.PI;
      const ex = a * Math.cos(angle);
      const ey = b * Math.sin(angle);
      const { x: dx, y: dy } = mathToDesign(ex, ey, scale);
      points.push(`${i === 0 ? "M" : "L"} ${dx.toFixed(2)} ${dy.toFixed(2)}`);
    }
    points.push("Z");
    return points.join(" ");
  }, [a, b, scale]);

  // 离心圆 (半径 a) SVG
  const auxCircleDesign = useMemo(() => {
    const { x: cx, y: cy } = mathToDesign(0, 0, scale);
    const rX = a * scale.scaleX;
    const rY = a * scale.scaleY;
    return { cx, cy, rX, rY };
  }, [a, scale]);

  // 内切圆 (半径 b) SVG
  const inCircleDesign = useMemo(() => {
    const { x: cx, y: cy } = mathToDesign(0, 0, scale);
    const rX = b * scale.scaleX;
    const rY = b * scale.scaleY;
    return { cx, cy, rX, rY };
  }, [b, scale]);

  // 定点 P0 设计坐标
  const p0Design = useMemo(() => mathToDesign(x0, y0, scale), [x0, y0, scale]);

  // 动点 P(t) 设计坐标
  const ptDesign = useMemo(
    () => mathToDesign(lineResult.Pt.x, lineResult.Pt.y, scale),
    [lineResult.Pt, scale],
  );

  // 割线交点 A, B 设计坐标
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

  // 椭圆参数点 P, Paux 设计坐标
  const pParamDesign = useMemo(
    () => mathToDesign(ellipseResult.P.x, ellipseResult.P.y, scale),
    [ellipseResult.P, scale],
  );
  const pAuxDesign = useMemo(
    () => mathToDesign(ellipseResult.Paux.x, ellipseResult.Paux.y, scale),
    [ellipseResult.Paux, scale],
  );

  // 直线采样线段
  const lineSegmentPath = useMemo(() => {
    const rad = lineResult.alphaRad;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const R = 10; // 延伸长度
    const pStart = mathToDesign(x0 - R * cosA, y0 - R * sinA, scale);
    const pEnd = mathToDesign(x0 + R * cosA, y0 + R * sinA, scale);
    return `M ${pStart.x} ${pStart.y} L ${pEnd.x} ${pEnd.y}`;
  }, [x0, y0, lineResult.alphaRad, scale]);

  // 标签避让计算
  const labelEntries = useMemo<LabelEntry[]>(() => {
    if (studyMode === "ellipseParam") {
      return [
        {
          key: "P",
          x: pParamDesign.x,
          y: pParamDesign.y,
          text: `P(${ellipseResult.P.x.toFixed(1)}, ${ellipseResult.P.y.toFixed(1)})`,
          anchor: "middle",
          dy: -14,
        },
        {
          key: "Paux",
          x: pAuxDesign.x,
          y: pAuxDesign.y,
          text: "P_aux(a cosθ, a sinθ)",
          anchor: "middle",
          dy: -14,
        },
      ];
    }

    const items: LabelEntry[] = [
      {
        key: "P0",
        x: p0Design.x,
        y: p0Design.y,
        text: `P0(${x0.toFixed(1)}, ${y0.toFixed(1)})`,
        anchor: "middle",
        dy: -14,
      },
    ];
    if (lineResult.valid) {
      items.push({
        key: "A",
        x: paDesign.x,
        y: paDesign.y,
        text: `A(t1=${lineResult.t1.toFixed(2)})`,
        anchor: "middle",
        dy: -14,
      });
      items.push({
        key: "B",
        x: pbDesign.x,
        y: pbDesign.y,
        text: `B(t2=${lineResult.t2.toFixed(2)})`,
        anchor: "middle",
        dy: -14,
      });
      items.push({
        key: "M",
        x: pmDesign.x,
        y: pmDesign.y,
        text: `M(tM=${lineResult.tM.toFixed(2)})`,
        anchor: "middle",
        dy: 14,
      });
    }
    if (Math.abs(t) > 0.1) {
      items.push({
        key: "Pt",
        x: ptDesign.x,
        y: ptDesign.y,
        text: `P(t=${t.toFixed(1)})`,
        anchor: "middle",
        dy: -14,
      });
    }
    return items;
  }, [
    studyMode,
    pParamDesign,
    pAuxDesign,
    p0Design,
    paDesign,
    pbDesign,
    pmDesign,
    ptDesign,
    x0,
    y0,
    lineResult,
    t,
    ellipseResult,
  ]);

  const placedLabels = useMemo(() => {
    return avoidLabels(labelEntries, { fontScale });
  }, [labelEntries, fontScale]);

  return (
    <g>
      {/* 1. 直角坐标系 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 椭圆主曲线 */}
      <path
        d={ellipsePath}
        fill={withAlpha(MATH_COLORS.ellipse, 0.08)}
        stroke={MATH_COLORS.ellipse}
        strokeWidth={2.5}
      />

      {/* Mode 2: 椭圆参数方程与辅助圆 */}
      {studyMode === "ellipseParam" && (
        <>
          {/* 辅助离心圆 (半径 a) */}
          <ellipse
            cx={auxCircleDesign.cx}
            cy={auxCircleDesign.cy}
            rx={auxCircleDesign.rX}
            ry={auxCircleDesign.rY}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          {/* 内切圆 (半径 b) */}
          <ellipse
            cx={inCircleDesign.cx}
            cy={inCircleDesign.cy}
            rx={inCircleDesign.rX}
            ry={inCircleDesign.rY}
            fill="none"
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* 原点 O 到离心圆点 P_aux 的射线 */}
          {(() => {
            const pO = mathToDesign(0, 0, scale);
            return (
              <line
                x1={pO.x}
                y1={pO.y}
                x2={pAuxDesign.x}
                y2={pAuxDesign.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
              />
            );
          })()}

          {/* 垂直投影虚线 P_aux -> P */}
          <line
            x1={pAuxDesign.x}
            y1={pAuxDesign.y}
            x2={pParamDesign.x}
            y2={pParamDesign.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* 离心圆点 P_aux */}
          <circle
            cx={pAuxDesign.x}
            cy={pAuxDesign.y}
            r={5}
            fill={MATH_COLORS.paramPrimary}
          />

          {/* 椭圆切线 (若有效) */}
          {isFinite(ellipseResult.interceptX) &&
            (() => {
              const ix = ellipseResult.interceptX;
              const iy = ellipseResult.interceptY;
              const pX = mathToDesign(ix, 0, scale);
              const pY = mathToDesign(0, iy, scale);
              return (
                <line
                  x1={pX.x}
                  y1={pX.y}
                  x2={pY.x}
                  y2={pY.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeWidth={2}
                />
              );
            })()}

          {/* 椭圆动点 P(a cosθ, b sinθ) 可拖拽 */}
          <InteractivePoint
            cx={pParamDesign.x}
            cy={pParamDesign.y}
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
          {/* 直线 */}
          <path
            d={lineSegmentPath}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray={lineResult.valid ? undefined : "6 6"}
          />

          {/* 割线交点 A, B */}
          {lineResult.valid && (
            <>
              {/* 弦线段 A-B 加厚高亮 */}
              <line
                x1={paDesign.x}
                y1={paDesign.y}
                x2={pbDesign.x}
                y2={pbDesign.y}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={3.5}
              />
              <circle
                cx={paDesign.x}
                cy={paDesign.y}
                r={5}
                fill={MATH_COLORS.paramSecondary}
              />
              <circle
                cx={pbDesign.x}
                cy={pbDesign.y}
                r={5}
                fill={MATH_COLORS.paramSecondary}
              />

              {/* 弦中点 M */}
              <circle
                cx={pmDesign.x}
                cy={pmDesign.y}
                r={4}
                fill={MATH_COLORS.focusPoint}
              />
            </>
          )}

          {/* 定点 P0 到动点 P(t) 的向量 P0P */}
          {Math.abs(t) > 0.1 && (
            <VectorArrow
              from={[x0, y0]}
              to={[lineResult.Pt.x, lineResult.Pt.y]}
              scale={scale}
              color={MATH_COLORS.paramSecondary}
              strokeWidth={2.5}
              fontScale={fontScale}
            />
          )}

          {/* 动点 P(t) 可拖拽 */}
          {Math.abs(t) > 0.1 && (
            <circle
              cx={ptDesign.x}
              cy={ptDesign.y}
              r={5}
              fill={MATH_COLORS.paramSecondary}
            />
          )}

          {/* 定点 P0(x0, y0) 可拖拽 */}
          <InteractivePoint
            cx={p0Design.x}
            cy={p0Design.y}
            scale={scale}
            vp={vp}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
            onDrag={({ x, y }) => {
              onParamChange("x0", Number(x.toFixed(1)));
              onParamChange("y0", Number(y.toFixed(1)));
            }}
          />
        </>
      )}

      {/* 3. 渲染避让后的标签 */}
      {placedLabels.map((lbl) => {
        const isPrimary = lbl.key === "P0" || lbl.key === "P";
        return (
          <g key={lbl.key}>
            <text
              x={lbl.rect.x + lbl.rect.w / 2}
              y={lbl.rect.y + lbl.rect.h / 2}
              fontSize={fontScale(12)}
              fontWeight={isPrimary ? "bold" : "normal"}
              fill={
                lbl.key === "P0"
                  ? MATH_COLORS.paramTertiary
                  : lbl.key === "A" || lbl.key === "B"
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.paramPrimary
              }
              textAnchor="middle"
              dominantBaseline="middle"
              className="select-none pointer-events-none"
            >
              {lbl.text}
            </text>
          </g>
        );
      })}
    </g>
  );
};
