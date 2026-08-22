/**
 * src/features/sequence/components/RecurrenceLinearPanScene.tsx
 * 一阶线性递推：待定系数与不动点蛛网图 (Cobweb plot)
 */
import React from "react";
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { calcLinearRecurrence } from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export const RecurrenceLinearPanScene: React.FC<RecurrenceSceneBaseProps> = ({
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
  const N = resolveN(params);
  const legendX = legendXOf(vp);

  const linearData = calcLinearRecurrence(a1, p_rec, q_rec, N);
  const { terms, fixedPoint, cobwebPoints } = linearData;
  const fnLine = (x: number) => p_rec * x + q_rec;
  const diagLine = (x: number) => x;

  let cobwebPathStr = "";
  cobwebPoints.forEach((pt, idx) => {
    const dPt = mathToDesign(pt.x, pt.y, scale);
    if (idx === 0) {
      cobwebPathStr += `M ${dPt.x} ${dPt.y}`;
    } else {
      cobwebPathStr += ` L ${dPt.x} ${dPt.y}`;
    }
  });

  return (
    <g className="recurrence-scene-linear-pan">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 迭代函数直线 y = px + q */}
      <FunctionGraph
        fn={fnLine}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        strokeWidth={1.75}
        strokeDasharray="5,4"
      />

      {/* 对角参考线 y = x */}
      <FunctionGraph
        fn={diagLine}
        scale={scale}
        color={MATH_COLORS.labelText}
        strokeWidth={1.2}
        strokeDasharray="4,4"
      />

      {/* 蛛网图阶梯迭代折线 */}
      <path
        d={cobwebPathStr}
        fill="none"
        stroke={MATH_COLORS.sequenceCobweb}
        strokeWidth={2}
        strokeDasharray="3,2"
      />

      {/* 不动点 (c, c) 标注 */}
      {fixedPoint !== null && (
        <g>
          <circle
            cx={mathToDesign(fixedPoint, fixedPoint, scale).x}
            cy={mathToDesign(fixedPoint, fixedPoint, scale).y}
            r={6}
            fill={MATH_COLORS.paramTertiary}
            stroke={MATH_COLORS.white}
            strokeWidth={2}
          />
          <text
            x={mathToDesign(fixedPoint, fixedPoint, scale).x + 10}
            y={mathToDesign(fixedPoint, fixedPoint, scale).y - 10}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.paramTertiary}
            fontWeight="bold"
          >
            <tspan>不动点 </tspan>
            <tspan fontStyle="italic">c</tspan>
            <tspan>{` = ${fixedPoint.toFixed(2)}`}</tspan>
          </text>
        </g>
      )}

      {/* 各项散点与平移等比数列对比 (优雅数学下标排版) */}
      {terms.map((t) => {
        const posAn = mathToDesign(t.an, t.an, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n === 1 || t.n === N || isHighlighted;

        return (
          <g
            key={`lin-term-${t.n}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectN?.(t.n)}
          >
            {/* 高亮光晕 */}
            {isHighlighted && (
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={12}
                fill={withAlpha(MATH_COLORS.sequence, 0.25)}
              />
            )}

            {/* 原数列散点 a_n 在对角线上 */}
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
          height={56}
          rx={8}
          fill={withAlpha(MATH_COLORS.white, 0.92)}
          stroke="#CBD5E1"
          strokeWidth={1}
        />
        <line
          x1={14}
          y1={18}
          x2={32}
          y2={18}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
          strokeDasharray="4,3"
        />
        <text
          x={40}
          y={22}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          <tspan>函数线 </tspan>
          <tspan fontStyle="italic">y</tspan>
          <tspan> = </tspan>
          <tspan fontStyle="italic">px</tspan>
          <tspan> + </tspan>
          <tspan fontStyle="italic">q</tspan>
        </text>
        <line
          x1={14}
          y1={38}
          x2={32}
          y2={38}
          stroke={MATH_COLORS.sequenceCobweb}
          strokeWidth={2}
        />
        <text
          x={40}
          y={42}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
        >
          <tspan>蛛网迭代 </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>₁</tspan>
          <tspan> → </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>₂</tspan>
          <tspan> → </tspan>
          <tspan fontStyle="italic">a</tspan>
          <tspan fontSize={fontScale(8)}>₃</tspan>
        </text>
      </g>
    </g>
  );
};
