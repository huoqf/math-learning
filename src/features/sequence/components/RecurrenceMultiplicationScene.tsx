/**
 * src/features/sequence/components/RecurrenceMultiplicationScene.tsx
 * 累乘法：比值连乘与散点
 */
import React from "react";
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { calcMultiplicationRecurrence } from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export type MultType = "n_over_n1" | "n1_over_n" | "pow_two";

interface Props extends RecurrenceSceneBaseProps {
  multType?: MultType;
}

export const RecurrenceMultiplicationScene: React.FC<Props> = ({
  params,
  scale,
  vp,
  fontScale,
  multType = "n_over_n1",
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
}) => {
  const a1 = params.a1 ?? 3;
  const N = resolveN(params);
  const legendX = legendXOf(vp);

  const multData = calcMultiplicationRecurrence(a1, multType, N);
  const terms = multData.terms;

  return (
    <g className="recurrence-scene-multiplication">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 绘制相邻项连乘比例折线 */}
      {terms.map((t, idx) => {
        if (idx === terms.length - 1) return null;
        const nextTerm = terms[idx + 1];
        const p1 = mathToDesign(t.n, t.an, scale);
        const p2 = mathToDesign(nextTerm.n, nextTerm.an, scale);

        return (
          <g key={`mult-line-${t.n}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1.5}
              strokeDasharray="3,3"
            />
            {(t.n === 1 || t.n === N - 1 || t.n === highlightN) && (
              <text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 - 8}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={MATH_COLORS.paramTertiary}
                fontWeight="bold"
              >
                {`×${t.ratioK.toFixed(2)}`}
              </text>
            )}
          </g>
        );
      })}

      {/* 散点 */}
      {terms.map((t) => {
        const posAn = mathToDesign(t.n, t.an, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n === 1 || t.n === N || isHighlighted;

        return (
          <g
            key={`mult-${t.n}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectN?.(t.n)}
          >
            <line
              x1={posAn.x}
              y1={mathToDesign(t.n, 0, scale).y}
              x2={posAn.x}
              y2={posAn.y}
              stroke={MATH_COLORS.sequenceStem}
              strokeDasharray="3,3"
            />
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
                val={t.an.toFixed(2)}
                fill={MATH_COLORS.sequence}
                fontScale={fontScale}
                fontSize={10}
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
          height={50}
          rx={8}
          fill={withAlpha(MATH_COLORS.white, 0.92)}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1}
        />
        <text
          x={14}
          y={20}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          <tspan>累乘求积：</tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
          <tspan> = </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>₁</tspan>
          <tspan> · Π </tspan>
          <tspan fontStyle="italic">f(k)</tspan>
        </text>
        <text
          x={14}
          y={36}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.paramTertiary}
        >
          虚线连线比例 = 比值因式 f(k)
        </text>
      </g>
    </g>
  );
};
