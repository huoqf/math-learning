/**
 * src/features/sequence/components/RecurrenceReciprocalScene.tsx
 * 倒数与分式递推构造
 */
import React from "react";
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { calcReciprocalRecurrence } from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export const RecurrenceReciprocalScene: React.FC<RecurrenceSceneBaseProps> = ({
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
  const coefA = params.coefA ?? 2;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;
  const N = resolveN(params);
  const legendX = legendXOf(vp);

  const recipData = calcReciprocalRecurrence(a1, coefA, coefB, coefC, N);
  const terms = recipData.terms;

  return (
    <g className="recurrence-scene-reciprocal">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 倒数辅助数列 b_n = 1/a_n 的递推连线 */}
      {terms.map((t, idx) => {
        if (idx === terms.length - 1) return null;
        const next = terms[idx + 1];
        if (Number.isNaN(t.bn) || Number.isNaN(next.bn)) return null;
        const p1 = mathToDesign(t.n, t.bn, scale);
        const p2 = mathToDesign(next.n, next.bn, scale);
        return (
          <g key={`recip-b-link-${t.n}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={withAlpha(MATH_COLORS.paramSecondary, 0.55)}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            {t.n === 1 && (
              <text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 + 14}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={MATH_COLORS.paramSecondary}
                fontWeight="bold"
              >
                {recipData.isReciprocalLinear
                  ? `+d=${(coefB / coefA).toFixed(2)} (等差)`
                  : `×${(coefC / coefA).toFixed(2)}+${(coefB / coefA).toFixed(2)}`}
              </text>
            )}
          </g>
        );
      })}

      {terms.map((t) => {
        const posAn = mathToDesign(t.n, t.an, scale);
        const posBn = Number.isNaN(t.bn)
          ? null
          : mathToDesign(t.n, t.bn, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n === 1 || t.n === N || isHighlighted;

        return (
          <g
            key={`recip-${t.n}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectN?.(t.n)}
          >
            {/* 原数列引线 */}
            {!Number.isNaN(t.an) && (
              <line
                x1={posAn.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posAn.x}
                y2={posAn.y}
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="3,3"
              />
            )}

            {/* 原数列散点 */}
            {!Number.isNaN(t.an) && (
              <g>
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
            )}

            {/* 倒数数列 b_n = 1/a_n */}
            {posBn && (
              <g>
                <circle
                  cx={posBn.x}
                  cy={posBn.y}
                  r={4.5}
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
          <tspan>原分式数列 </tspan>
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
          <tspan>倒数构造 </tspan>
          <tspan fontStyle="italic">b</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
          <tspan> = 1 / </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
        </text>
      </g>
    </g>
  );
};
