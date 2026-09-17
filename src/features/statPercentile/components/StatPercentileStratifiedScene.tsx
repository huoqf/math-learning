/**
 * src/features/statPercentile/components/StatPercentileStratifiedScene.tsx
 * 分层抽样场景：比例分配卡片、均值离差数轴拉扯与总方差分解堆叠条
 * 纯 SVG 渲染，零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import type { StratifiedResult } from "@/math/statPercentile";

interface StatPercentileStratifiedSceneProps {
  strat: StratifiedResult;
  scale: SceneScale;
  vp?: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export const StatPercentileStratifiedScene: React.FC<
  StatPercentileStratifiedSceneProps
> = ({ strat, scale, vp, onParamChange, fontScale = (v) => v }) => {
  const isTwoStrata = strat.strataN[2] <= 0;

  const rawStrataInfo = [
    {
      key: "mean1",
      name: "第 1 层 (A组)",
      indexLabel: "1",
      N: strat.strataN[0],
      n: strat.strataSampleN[0],
      weight: strat.strataWeights[0],
      mean: strat.strataMeans[0],
      var: strat.strataVars[0],
      color: MATH_COLORS.paramPrimary,
      yPos: isTwoStrata ? 0.42 : 0.32,
    },
    {
      key: "mean2",
      name: "第 2 层 (B组)",
      indexLabel: "2",
      N: strat.strataN[1],
      n: strat.strataSampleN[1],
      weight: strat.strataWeights[1],
      mean: strat.strataMeans[1],
      var: strat.strataVars[1],
      color: MATH_COLORS.paramSecondary,
      yPos: isTwoStrata ? 0.65 : 0.52,
    },
    {
      key: "mean3",
      name: "第 3 层 (C组)",
      indexLabel: "3",
      N: strat.strataN[2],
      n: strat.strataSampleN[2],
      weight: strat.strataWeights[2],
      mean: strat.strataMeans[2],
      var: strat.strataVars[2],
      color: MATH_COLORS.paramTertiary,
      yPos: 0.72,
    },
  ];

  const activeStrata = rawStrataInfo.filter((s) => s.N > 0);

  // 坐标轴端点位置
  const xAxisStart = mathToDesign(46, 0.12, scale);
  const xAxisEnd = mathToDesign(105, 0.12, scale);

  return (
    <g key="stat-percentile-stratified-scene">
      {/* ────────────────── 1. 顶部：分层抽样比例分配卡片系统 ────────────────── */}
      {(() => {
        const ptTopLeft = mathToDesign(48, 0.98, scale);
        const cardWidth = 160;
        const cardHeight = 44;
        const gap = 16;

        return (
          <g key="strata-header-cards">
            {/* 总体与抽样比总览卡片 */}
            <rect
              x={ptTopLeft.x}
              y={ptTopLeft.y}
              width={cardWidth}
              height={cardHeight}
              rx={6}
              fill={withAlpha(MATH_COLORS.axis, 0.06)}
              stroke={withAlpha(MATH_COLORS.axis, 0.3)}
            />
            <text
              x={ptTopLeft.x + 12}
              y={ptTopLeft.y + 18}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
            >
              总体 N={strat.totalN} → 抽样 n={strat.sampleN}
            </text>
            <text
              x={ptTopLeft.x + 12}
              y={ptTopLeft.y + 34}
              fill={MATH_COLORS.function}
              fontSize={fontScale(9.5)}
              fontWeight="600"
            >
              抽样比 f = n/N = {(strat.samplingRatio * 100).toFixed(1)}%
            </text>

            {/* 各层按比例分配卡片 */}
            {activeStrata.map((st, idx) => {
              const cardX = ptTopLeft.x + (idx + 1) * (cardWidth + gap);
              return (
                <g key={`strata-card-${idx}`}>
                  <rect
                    x={cardX}
                    y={ptTopLeft.y}
                    width={cardWidth}
                    height={cardHeight}
                    rx={6}
                    fill={withAlpha(st.color, 0.08)}
                    stroke={st.color}
                    strokeWidth={1.5}
                  />
                  <text
                    x={cardX + 10}
                    y={ptTopLeft.y + 17}
                    fill={st.color}
                    fontSize={fontScale(10.5)}
                    fontWeight="bold"
                  >
                    {st.name}: N{st.indexLabel}={st.N}人
                  </text>
                  <text
                    x={cardX + 10}
                    y={ptTopLeft.y + 34}
                    fill={MATH_COLORS.labelText}
                    fontSize={fontScale(9.5)}
                  >
                    分配抽取{" "}
                    <tspan fontWeight="bold" fill={st.color}>
                      n{st.indexLabel}={st.n}
                    </tspan>
                    人 (权重 {(st.weight * 100).toFixed(0)}%)
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ────────────────── 2. 中部：统一样本数值数轴 (50 ~ 100) ────────────────── */}
      <g key="stratified-number-axis">
        <line
          x1={xAxisStart.x}
          y1={xAxisStart.y}
          x2={xAxisEnd.x}
          y2={xAxisEnd.y}
          stroke={MATH_COLORS.axis}
          strokeWidth={2}
        />
        <polygon
          points={`${xAxisEnd.x},${xAxisEnd.y} ${xAxisEnd.x - 8},${xAxisEnd.y - 4} ${xAxisEnd.x - 8},${xAxisEnd.y + 4}`}
          fill={MATH_COLORS.axis}
        />
        <text
          x={xAxisEnd.x - 5}
          y={xAxisEnd.y + 20}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          样本数值 x
        </text>

        {[50, 60, 70, 80, 90, 100].map((xTick) => {
          const pt = mathToDesign(xTick, 0.12, scale);
          return (
            <g key={`strat-axis-tick-${xTick}`}>
              <line
                x1={pt.x}
                y1={pt.y}
                x2={pt.x}
                y2={pt.y + 5}
                stroke={MATH_COLORS.axis}
                strokeWidth={1.5}
              />
              <text
                x={pt.x}
                y={pt.y + 18}
                textAnchor="middle"
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(11)}
                fontWeight="600"
                fontFamily="monospace"
              >
                {xTick}
              </text>
            </g>
          );
        })}
      </g>

      {/* ────────────────── 3. 总体均值贯穿参考线与卡片 ────────────────── */}
      {(() => {
        const ptMeanTop = mathToDesign(strat.totalMean, 0.82, scale);
        const ptMeanBot = mathToDesign(strat.totalMean, 0.12, scale);

        return (
          <g key="total-mean-vertical-indicator">
            <line
              x1={ptMeanTop.x}
              y1={ptMeanTop.y}
              x2={ptMeanBot.x}
              y2={ptMeanBot.y}
              stroke={MATH_COLORS.function}
              strokeWidth={2.5}
              strokeDasharray="5 3"
            />
            <rect
              x={ptMeanTop.x - 65}
              y={ptMeanTop.y - 24}
              width={130}
              height={24}
              rx={5}
              fill={MATH_COLORS.function}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))"
            />
            <text
              x={ptMeanTop.x}
              y={ptMeanTop.y - 8}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
            >
              总体均值 x̄ = {strat.totalMean.toFixed(2)}
            </text>
          </g>
        );
      })()}

      {/* ────────────────── 4. 各层均值点、离散区间与离差拉扯指示 ────────────────── */}
      <g key="strata-mean-and-spread-bars">
        {activeStrata.map((st, idx) => {
          const stdDev = Math.sqrt(st.var);
          const ptMean = mathToDesign(st.mean, st.yPos, scale);
          const ptStdLeft = mathToDesign(
            Math.max(50, st.mean - stdDev),
            st.yPos,
            scale,
          );
          const ptStdRight = mathToDesign(
            Math.min(100, st.mean + stdDev),
            st.yPos,
            scale,
          );
          const ptTotalMeanAtLayer = mathToDesign(
            strat.totalMean,
            st.yPos,
            scale,
          );

          return (
            <g key={`strata-mean-bar-${idx}`}>
              {/* 层背景横轴导引线 */}
              <line
                x1={mathToDesign(48, st.yPos, scale).x}
                y1={ptMean.y}
                x2={mathToDesign(102, st.yPos, scale).x}
                y2={ptMean.y}
                stroke={withAlpha(MATH_COLORS.axis, 0.1)}
                strokeWidth={1}
                strokeDasharray="2 2"
              />

              {/* 该层离散波动区间棒 (±s) */}
              <rect
                x={ptStdLeft.x}
                y={ptMean.y - 12}
                width={Math.abs(ptStdRight.x - ptStdLeft.x)}
                height={24}
                rx={12}
                fill={withAlpha(st.color, 0.15)}
                stroke={withAlpha(st.color, 0.6)}
                strokeWidth={1.5}
              />
              <text
                x={ptStdRight.x + 8}
                y={ptMean.y + 4}
                fill={st.color}
                fontSize={fontScale(9)}
                fontWeight="600"
              >
                s{st.indexLabel}²={st.var} (±{stdDev.toFixed(1)})
              </text>

              {/* 组间离差拉扯跨度虚线 (连接层均值与总均值) */}
              {Math.abs(st.mean - strat.totalMean) > 0.4 && (
                <g key={`diff-bracket-${idx}`}>
                  <line
                    x1={ptMean.x}
                    y1={ptMean.y - 18}
                    x2={ptTotalMeanAtLayer.x}
                    y2={ptMean.y - 18}
                    stroke={st.color}
                    strokeWidth={1.8}
                    strokeDasharray="3 2"
                  />
                  <line
                    x1={ptMean.x}
                    y1={ptMean.y - 23}
                    x2={ptMean.x}
                    y2={ptMean.y - 13}
                    stroke={st.color}
                    strokeWidth={1.5}
                  />
                  <line
                    x1={ptTotalMeanAtLayer.x}
                    y1={ptMean.y - 23}
                    x2={ptTotalMeanAtLayer.x}
                    y2={ptMean.y - 13}
                    stroke={st.color}
                    strokeWidth={1.5}
                  />
                  <text
                    x={(ptMean.x + ptTotalMeanAtLayer.x) / 2}
                    y={ptMean.y - 23}
                    textAnchor="middle"
                    fill={st.color}
                    fontSize={fontScale(9.5)}
                    fontWeight="bold"
                  >
                    |x̄{st.indexLabel} - x̄| ={" "}
                    {Math.abs(st.mean - strat.totalMean).toFixed(1)}
                  </text>
                </g>
              )}

              {/* 层标签徽标 */}
              <text
                x={mathToDesign(48, st.yPos, scale).x + 4}
                y={ptMean.y + 4}
                fill={st.color}
                fontSize={fontScale(10)}
                fontWeight="bold"
              >
                {st.name}
              </text>

              {/* 交互拖拽点：直接在数轴高度拖动该层均值 */}
              {vp && onParamChange && (
                <InteractivePoint
                  cx={st.mean}
                  cy={st.yPos}
                  scale={scale}
                  vp={vp}
                  onDrag={(newPos) => {
                    const targetX = Math.round(
                      Math.max(50, Math.min(100, newPos.x)),
                    );
                    onParamChange(st.key, targetX);
                  }}
                  color={st.color}
                  r={7}
                  fontScale={fontScale}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* ────────────────── 5. 底部：总体方差分解可视化堆叠条 (组内方差 + 组间离差) ────────────────── */}
      {(() => {
        const intraVar =
          strat.strataWeights[0] * strat.strataVars[0] +
          strat.strataWeights[1] * strat.strataVars[1] +
          strat.strataWeights[2] * strat.strataVars[2];
        const interMeanVar = Math.max(0, strat.totalVar - intraVar);

        const ptBarStart = mathToDesign(50, -0.04, scale);
        const ptBarEnd = mathToDesign(100, -0.04, scale);
        const totalWidthPx = Math.max(260, ptBarEnd.x - ptBarStart.x);
        const barHeight = 24;

        const intraRatio = strat.totalVar > 0 ? intraVar / strat.totalVar : 0.5;
        const intraWidthPx = Math.max(
          20,
          Math.min(totalWidthPx - 20, intraRatio * totalWidthPx),
        );
        const interWidthPx = totalWidthPx - intraWidthPx;

        return (
          <g key="total-variance-decomposition-bar">
            {/* 背景框 */}
            <rect
              x={ptBarStart.x - 12}
              y={ptBarStart.y - 30}
              width={totalWidthPx + 24}
              height={62}
              rx={8}
              fill={withAlpha(MATH_COLORS.function, 0.05)}
              stroke={withAlpha(MATH_COLORS.function, 0.25)}
            />
            <text
              x={ptBarStart.x}
              y={ptBarStart.y - 10}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              总体方差分解：s² = {strat.totalVar.toFixed(2)} = 组内方差贡献 +
              组间均值离差贡献
            </text>

            {/* 组内方差贡献段 (蓝色) */}
            <rect
              x={ptBarStart.x}
              y={ptBarStart.y}
              width={intraWidthPx}
              height={barHeight}
              rx={4}
              fill={withAlpha(MATH_COLORS.function, 0.85)}
            />
            <text
              x={ptBarStart.x + intraWidthPx / 2}
              y={ptBarStart.y + 16}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              组内方差: {intraVar.toFixed(1)} (
              {((intraVar / Math.max(0.1, strat.totalVar)) * 100).toFixed(0)}%)
            </text>

            {/* 组间离差贡献段 (橙色) */}
            <rect
              x={ptBarStart.x + intraWidthPx}
              y={ptBarStart.y}
              width={interWidthPx}
              height={barHeight}
              rx={4}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.9)}
            />
            <text
              x={ptBarStart.x + intraWidthPx + interWidthPx / 2}
              y={ptBarStart.y + 16}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              组间离差: {interMeanVar.toFixed(1)} (
              {((interMeanVar / Math.max(0.1, strat.totalVar)) * 100).toFixed(
                0,
              )}
              %)
            </text>
          </g>
        );
      })()}
    </g>
  );
};
