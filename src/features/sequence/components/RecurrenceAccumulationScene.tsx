/**
 * src/features/sequence/components/RecurrenceAccumulationScene.tsx
 * 累加法：差分增量柱状堆叠与散点
 */
import React from "react";
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  calcAccumulationRecurrence,
  type AccumulationFnType,
} from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

interface Props extends RecurrenceSceneBaseProps {
  accumFnType?: AccumulationFnType;
}

export const RecurrenceAccumulationScene: React.FC<Props> = ({
  params,
  scale,
  vp,
  fontScale,
  accumFnType = "arithmetic",
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
}) => {
  const a1 = params.a1 ?? 3;
  const stepParam = params.stepParam ?? 2;
  const N = resolveN(params);
  const legendX = legendXOf(vp);

  const accumData = calcAccumulationRecurrence(a1, accumFnType, stepParam, N);
  const terms = accumData.terms;

  return (
    <g className="recurrence-scene-accumulation">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 绘制相邻项差分增量阶梯柱形 */}
      {terms.map((t, idx) => {
        if (idx === terms.length - 1) return null;
        const nextTerm = terms[idx + 1];
        const p1 = mathToDesign(t.n, t.an, scale);
        const p2 = mathToDesign(nextTerm.n, nextTerm.an, scale);
        const pMid = mathToDesign(nextTerm.n, t.an, scale);

        return (
          <g key={`accum-bar-${t.n}`}>
            {/* 阶梯增量色块 */}
            <polygon
              points={`${p1.x},${p1.y} ${pMid.x},${pMid.y} ${p2.x},${p2.y}`}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.22)}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            {/* 增量数值标注 */}
            {(t.n === 1 || t.n === N - 1 || t.n === highlightN) && (
              <text
                x={pMid.x + 8}
                y={(pMid.y + p2.y) / 2 + 4}
                fontSize={fontScale(10)}
                fill={MATH_COLORS.paramSecondary}
                fontWeight="bold"
              >
                <tspan>+Δ</tspan>
                <tspan fontStyle="italic">a</tspan>
                <tspan fontSize={fontScale(8)} dy={fontScale(2)}>
                  {t.n}
                </tspan>
                <tspan dy={-fontScale(2)}>{` = ${t.deltaK.toFixed(1)}`}</tspan>
              </text>
            )}
          </g>
        );
      })}

      {/* 数列散点 */}
      {terms.map((t) => {
        const posAn = mathToDesign(t.n, t.an, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n === 1 || t.n === N || isHighlighted;

        return (
          <g
            key={`accum-${t.n}`}
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
                val={t.an.toFixed(1)}
                fill={MATH_COLORS.sequence}
                fontScale={fontScale}
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
          stroke="#CBD5E1"
          strokeWidth={1}
        />
        <text
          x={14}
          y={20}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          <tspan>累加求和：</tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
          <tspan> = </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>₁</tspan>
          <tspan> + Σ </tspan>
          <tspan fontStyle="italic">f(k)</tspan>
        </text>
        <text
          x={14}
          y={36}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.paramSecondary}
        >
          阶梯色块高度 = 增量 Δa_k
        </text>
      </g>
    </g>
  );
};
