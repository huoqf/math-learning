/**
 * src/features/sequence/components/RecurrenceSecondOrderScene.tsx
 * 二阶特征根法
 */
import React from "react";
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { calcSecondOrderRecurrence } from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export const RecurrenceSecondOrderScene: React.FC<RecurrenceSceneBaseProps> = ({
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
  const a2 = params.a2 ?? 2;
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const N = resolveN(params);
  const legendX = legendXOf(vp);

  const secondData = calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N);
  const terms = secondData.terms;

  return (
    <g className="recurrence-scene-second-order">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {terms.map((t) => {
        const isClamped = t.an > scale.yMax;
        const displayAn = Math.min(t.an, scale.yMax - 0.2);
        const posAn = mathToDesign(t.n, displayAn, scale);
        const posBn = mathToDesign(t.n, t.bn, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n === 1 || t.n === N || isHighlighted;

        return (
          <g
            key={`sec-order-${t.n}`}
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
                fontSize={10}
                suffix={isClamped ? " ↑" : ""}
              />
            )}

            {/* 仅在特征方程判别式 delta >= 0 时构造降阶等比数列 */}
            {secondData.delta >= 0 && (
              <>
                <circle
                  cx={posBn.x}
                  cy={posBn.y}
                  r={4}
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
                    val={t.bn.toFixed(1)}
                    fill={MATH_COLORS.paramSecondary}
                    fontScale={fontScale}
                    fontSize={10}
                    fontWeight="normal"
                  />
                )}
              </>
            )}
          </g>
        );
      })}

      {/* 右上角图例与模型适用域状态说明 */}
      <g transform={`translate(${legendX}, 20)`}>
        <rect
          x={0}
          y={0}
          width={210}
          height={secondData.delta >= 0 ? 56 : 64}
          rx={8}
          fill={withAlpha(MATH_COLORS.white, 0.94)}
          stroke={
            secondData.delta >= 0 ? CANVAS_COLORS.axis : MATH_COLORS.degeneracy
          }
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
          <tspan>原二阶递推数列 </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>ₙ</tspan>
        </text>

        {secondData.delta >= 0 ? (
          <>
            <circle cx={14} cy={38} r={4.5} fill={MATH_COLORS.paramSecondary} />
            <text
              x={26}
              y={42}
              fontSize={fontScale(10.5)}
              fill={MATH_COLORS.labelText}
            >
              <tspan>构造降阶等比 </tspan>
              <tspan fontStyle="italic">b</tspan>
              <tspan fontSize={fontScale(8)}>ₙ</tspan>
            </text>
          </>
        ) : (
          <text
            x={14}
            y={44}
            fontSize={fontScale(9)}
            fill={MATH_COLORS.degeneracy}
            fontWeight="bold"
          >
            <tspan>Δ = p²+4q &lt; 0，降阶等比不适用</tspan>
          </text>
        )}
      </g>
    </g>
  );
};
