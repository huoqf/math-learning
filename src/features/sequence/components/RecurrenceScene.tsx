/**
 * src/features/sequence/components/RecurrenceScene.tsx
 * 递推数列与构造法求通项专属场景渲染组件 (高质量数学下标与公式级图解排版)
 */
import React from "react";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcNonHomogeneousExpRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
  type AccumulationFnType,
} from "@/math/sequence";

export interface RecurrenceSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  recurrenceModelType:
    | "linear-pan"
    | "accumulation"
    | "multiplication"
    | "non-homogeneous"
    | "reciprocal"
    | "second-order";
  accumFnType?: AccumulationFnType;
  multType?: "n_over_n1" | "n1_over_n" | "pow_two";
  highlightN: number;
  onSelectN?: (n: number) => void;
  xStep?: number;
  yStep?: number;
}

/**
 * 标准 SVG 数学下标标注组件：完美渲染 a_n = 3.0, b_1 = -5.2 等数学结构
 */
interface MathSubTextProps {
  x: number;
  y: number;
  base: string;
  sub?: string | number;
  val?: string | number;
  fill: string;
  fontScale: (v: number) => number;
  fontSize?: number;
  fontWeight?: string;
  suffix?: string;
}

const MathSubText: React.FC<MathSubTextProps> = ({
  x,
  y,
  base,
  sub,
  val,
  fill,
  fontScale,
  fontSize = 11,
  fontWeight = "bold",
  suffix = "",
}) => {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={fill}
      fontSize={fontScale(fontSize)}
      fontWeight={fontWeight}
    >
      <tspan fontStyle="italic">{base}</tspan>
      {sub !== undefined && (
        <tspan dy={fontScale(3)} fontSize={fontScale(fontSize * 0.78)}>
          {sub}
        </tspan>
      )}
      {val !== undefined && (
        <tspan dy={sub !== undefined ? -fontScale(3) : 0}>
          {` = ${val}${suffix}`}
        </tspan>
      )}
    </text>
  );
};

export const RecurrenceScene: React.FC<RecurrenceSceneProps> = ({
  params,
  scale,
  vp,
  fontScale,
  recurrenceModelType,
  accumFnType = "arithmetic",
  multType = "n_over_n1",
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
}) => {
  const a1 = params.a1 ?? 3;
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const r_rec = params.r_rec ?? 3;
  const stepParam = params.stepParam ?? 2;
  const a2 = params.a2 ?? 2;
  const coefA = params.coefA ?? 2;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;
  const N = Math.min(12, Math.max(4, Math.round(params.N ?? 8)));

  const legendX = Math.max(450, vp.designVisibleW - 240);

  // 1. 一阶线性递推：待定系数与不动点蛛网图 (Cobweb plot)
  if (recurrenceModelType === "linear-pan") {
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
  }

  // 2. 累加法：差分增量柱状堆叠与散点
  if (recurrenceModelType === "accumulation") {
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
                  <tspan
                    dy={-fontScale(2)}
                  >{` = ${t.deltaK.toFixed(1)}`}</tspan>
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
  }

  // 3. 累乘法：比值连乘与散点
  if (recurrenceModelType === "multiplication") {
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
  }

  // 4. 指数非齐次递推：同除构造法对照
  if (recurrenceModelType === "non-homogeneous") {
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
            stroke="#CBD5E1"
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
  }

  // 5. 倒数与分式递推构造
  if (recurrenceModelType === "reciprocal") {
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
            stroke="#CBD5E1"
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
  }

  // 6. 二阶特征根法
  if (recurrenceModelType === "second-order") {
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

              {/* 构造降阶等比数列 */}
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
        </g>
      </g>
    );
  }

  return null;
};
