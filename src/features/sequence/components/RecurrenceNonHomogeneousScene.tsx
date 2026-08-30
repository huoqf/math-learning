/**
 * src/features/sequence/components/RecurrenceNonHomogeneousScene.tsx
 * 指数非齐次递推：同除构造法对照
 */
import React from "react";
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { calcNonHomogeneousExpRecurrence } from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export const RecurrenceNonHomogeneousScene: React.FC<
  RecurrenceSceneBaseProps
> = ({
  params,
  scale,
  vp,
  fontScale,
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
}) => {
  const a1 = params.a1 ?? 3;
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const r_rec = params.r_rec ?? 3;
  const N = resolveN(params);
  const legendX = legendXOf(vp);

  const expData = calcNonHomogeneousExpRecurrence(a1, p_rec, q_rec, r_rec, N);
  const terms = expData.terms;

  return (
    <g className="recurrence-scene-non-homogeneous">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 绘制原数列与构造数列散点 */}
      {terms.map((t) => {
        const isClamped = t.an > scale.yMax;
        const displayAn = Math.min(t.an, scale.yMax - 0.2);
        const posAn = mathToDesign(t.n, displayAn, scale);
        const posBn = mathToDesign(t.n, t.bn, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n === 1 || t.n === N || isHighlighted;

        return (
          <g
            key={`exp-term-${t.n}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectN?.(t.n)}
          >
            {/* 原数列引线 */}
            <line
              x1={posAn.x}
              y1={mathToDesign(t.n, 0, scale).y}
              x2={posAn.x}
              y2={posAn.y}
              stroke={MATH_COLORS.sequenceStem}
              strokeDasharray="3,3"
            />

            {/* 原数列散点 */}
            {isHighlighted && (
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={12}
                fill={withAlpha(MATH_COLORS.sequence, 0.25)}
              />
            )}
            <circle
              cx={posAn.x}
              cy={posAn.y}
              r={isHighlighted ? 7 : 4.5}
              fill={MATH_COLORS.sequence}
              stroke={MATH_COLORS.white}
              strokeWidth={2}
            />
            {showLabel && (
              <MathSubText
                x={posAn.x}
                y={posAn.y - 12}
                base="a"
                sub={t.n}
                val={t.an.toFixed(1)}
                fill={MATH_COLORS.sequence}
                fontScale={fontScale}
                suffix={isClamped ? " ↑" : ""}
              />
            )}

            {/* 同除辅助数列 b_n = a_n / r^n */}
            <circle
              cx={posBn.x}
              cy={posBn.y}
              r={isHighlighted ? 6 : 4}
              fill={MATH_COLORS.paramSecondary}
              stroke={MATH_COLORS.white}
              strokeWidth={1.5}
            />
            {showLabel && (
              <MathSubText
                x={posBn.x}
                y={posBn.y + 16}
                base="b"
                sub={t.n}
                val={t.bn.toFixed(2)}
                fill={MATH_COLORS.paramSecondary}
                fontScale={fontScale}
                fontSize={10}
                fontWeight="normal"
              />
            )}
          </g>
        );
      })}

      {/* 右上角图例说明 */}
      <g transform={`translate(${legendX}, 20)`}>
        <rect
          x={0}
          y={0}
          width={210}
          height={56}
          rx={8}
          fill={withAlpha(MATH_COLORS.white, 0.92)}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1}
        />
        <circle cx={14} cy={18} r={4.5} fill={MATH_COLORS.sequence} />
        <text
          x={26}
          y={22}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          <tspan>原非齐次数列 </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
        </text>
        <circle cx={14} cy={38} r={4.5} fill={MATH_COLORS.paramSecondary} />
        <text
          x={26}
          y={42}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
        >
          <tspan>同除构造 </tspan>
          <tspan fontStyle="italic">b</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
          <tspan> = </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
          <tspan> / </tspan>
          <tspan fontStyle="italic">r</tspan>
          <tspan fontSize={fontScale(8)}>ⁿ</tspan>
        </text>
      </g>
    </g>
  );
};
