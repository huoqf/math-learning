/**
 * src/features/statPercentile/components/StatPercentileStratifiedScene.tsx
 * 分层抽样与总方差数形结合场景（studyMode === "stratified"）
 * 纯 SVG 渲染，零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { StratifiedResult } from "@/math/statPercentile";

interface StatPercentileStratifiedSceneProps {
  strat: StratifiedResult;
  scale: SceneScale;
  vp?: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

const toSub = (n: number | string) =>
  String(n)
    .split("")
    .map((c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)] ?? c)
    .join("");

export const StatPercentileStratifiedScene: React.FC<
  StatPercentileStratifiedSceneProps
> = ({ strat, scale, vp, onParamChange, fontScale = (v) => v }) => {
  return (
    <g key="mode-stratified-vis">
      {/* 1. 统一样本数值 X 轴 (50 ~ 100) */}
      {(() => {
        const pStart = mathToDesign(46, 0.08, scale);
        const pEnd = mathToDesign(105, 0.08, scale);

        return (
          <g key="stratified-axis">
            <line
              x1={pStart.x}
              y1={pStart.y}
              x2={pEnd.x}
              y2={pEnd.y}
              stroke={MATH_COLORS.axis}
              strokeWidth={2}
            />
            <polygon
              points={`${pEnd.x},${pEnd.y} ${pEnd.x - 8},${pEnd.y - 4} ${pEnd.x - 8},${pEnd.y + 4}`}
              fill={MATH_COLORS.axis}
            />
            <text
              x={pEnd.x - 5}
              y={pEnd.y + 20}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              样本数值 x
            </text>

            {[50, 60, 70, 80, 90, 100].map((xTick) => {
              const pt = mathToDesign(xTick, 0.08, scale);
              return (
                <g key={`strat-tick-${xTick}`}>
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
        );
      })()}

      {/* 2. 总体均值贯穿参考线 (蓝色虚线) */}
      {(() => {
        const ptMeanTop = mathToDesign(strat.totalMean, 0.88, scale);
        const ptMeanBot = mathToDesign(strat.totalMean, 0.08, scale);

        return (
          <g key="total-mean-line">
            <line
              x1={ptMeanTop.x}
              y1={ptMeanTop.y}
              x2={ptMeanBot.x}
              y2={ptMeanBot.y}
              stroke={MATH_COLORS.function}
              strokeWidth={2}
              strokeDasharray="5 3"
            />
            <rect
              x={ptMeanTop.x - 55}
              y={ptMeanTop.y - 22}
              width={110}
              height={22}
              rx={4}
              fill={MATH_COLORS.function}
            />
            <text
              x={ptMeanTop.x}
              y={ptMeanTop.y - 7}
              textAnchor="middle"
              fill={MATH_COLORS.white}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
            >
              总体均值 x̄ = {strat.totalMean.toFixed(2)}
            </text>
          </g>
        );
      })()}

      {/* 3. 高斯密度分布带与均值拖拽动点（自适应 2 层 / 3 层布局与空层隐藏） */}
      {(() => {
        const isTwoStrata = strat.strataN[2] <= 0;
        const rawStrataInfo = [
          {
            key: "mean1",
            name: "层 1 (组 A)",
            N: strat.strataN[0],
            n: strat.strataSampleN[0],
            weight: strat.strataWeights[0],
            mean: strat.strataMeans[0],
            var: strat.strataVars[0],
            yBase: isTwoStrata ? 0.3 : 0.24,
            color: MATH_COLORS.paramPrimary,
          },
          {
            key: "mean2",
            name: "层 2 (组 B)",
            N: strat.strataN[1],
            n: strat.strataSampleN[1],
            weight: strat.strataWeights[1],
            mean: strat.strataMeans[1],
            var: strat.strataVars[1],
            yBase: isTwoStrata ? 0.58 : 0.44,
            color: MATH_COLORS.paramSecondary,
          },
          {
            key: "mean3",
            name: "层 3 (组 C)",
            N: strat.strataN[2],
            n: strat.strataSampleN[2],
            weight: strat.strataWeights[2],
            mean: strat.strataMeans[2],
            var: strat.strataVars[2],
            yBase: 0.64,
            color: MATH_COLORS.paramTertiary,
          },
        ];

        const strataInfo = rawStrataInfo.filter((st) => st.N > 0);

        return (
          <g key="strata-distribution-curves">
            {strataInfo.map((st, i) => {
              const stdDev = Math.max(1, Math.sqrt(st.var));
              const steps = 60;
              const points: string[] = [];
              const xMin = 50;
              const xMax = 100;

              for (let s = 0; s <= steps; s++) {
                const xVal = xMin + (s / steps) * (xMax - xMin);
                const z = (xVal - st.mean) / stdDev;
                const gaussianY = st.yBase + 0.12 * Math.exp(-0.5 * z * z);
                const pt = mathToDesign(xVal, gaussianY, scale);
                if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
                  points.push(`${s === 0 ? "M" : "L"} ${pt.x} ${pt.y}`);
                }
              }
              const ptRightBase = mathToDesign(xMax, st.yBase, scale);
              const ptLeftBase = mathToDesign(xMin, st.yBase, scale);
              if (
                Number.isFinite(ptRightBase.x) &&
                Number.isFinite(ptRightBase.y) &&
                Number.isFinite(ptLeftBase.x) &&
                Number.isFinite(ptLeftBase.y)
              ) {
                points.push(`L ${ptRightBase.x} ${ptRightBase.y}`);
                points.push(`L ${ptLeftBase.x} ${ptLeftBase.y} Z`);
              }

              const pathD = points.join(" ");
              const ptMeanCenter = mathToDesign(st.mean, st.yBase, scale);
              const ptMeanTop = mathToDesign(st.mean, st.yBase + 0.12, scale);
              const ptTotalMeanAtLayer = mathToDesign(
                strat.totalMean,
                st.yBase,
                scale,
              );

              return (
                <g key={`strata-vis-${i}`}>
                  {/* 高斯分布半透明包络线 */}
                  <path
                    d={pathD}
                    fill={withAlpha(st.color, 0.2)}
                    stroke={st.color}
                    strokeWidth={2}
                  />

                  {/* 组内基线 */}
                  <line
                    x1={ptLeftBase.x}
                    y1={ptLeftBase.y}
                    x2={ptRightBase.x}
                    y2={ptRightBase.y}
                    stroke={withAlpha(st.color, 0.35)}
                    strokeWidth={1.5}
                  />

                  {/* 该层均值重心垂直虚线 */}
                  {Number.isFinite(ptMeanCenter.x) &&
                    Number.isFinite(ptMeanTop.y) && (
                      <line
                        x1={ptMeanCenter.x}
                        y1={ptMeanTop.y}
                        x2={ptMeanCenter.x}
                        y2={ptMeanCenter.y}
                        stroke={st.color}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                    )}

                  {/* 该层名称与参数 Badge */}
                  {(() => {
                    const ptBadge = mathToDesign(48, st.yBase + 0.11, scale);
                    if (
                      !Number.isFinite(ptBadge.x) ||
                      !Number.isFinite(ptBadge.y)
                    )
                      return null;
                    return (
                      <g>
                        <rect
                          x={ptBadge.x}
                          y={ptBadge.y - 12}
                          width={245}
                          height={22}
                          rx={4}
                          fill={withAlpha(st.color, 0.15)}
                          stroke={st.color}
                        />
                        <text
                          x={ptBadge.x + 8}
                          y={ptBadge.y + 3}
                          fill={st.color}
                          fontSize={fontScale(10)}
                          fontWeight="bold"
                        >
                          {st.name}: N{toSub(i + 1)} = {st.N}人(抽{st.n}人)
                          均值x̄{toSub(i + 1)} = {st.mean} 方差s
                          {toSub(i + 1)}² = {st.var}
                        </text>
                      </g>
                    );
                  })()}

                  {/* 离差跨度指示段 (连接该层均值与总体均值) */}
                  {Math.abs(st.mean - strat.totalMean) > 0.5 &&
                    Number.isFinite(ptMeanCenter.x) &&
                    Number.isFinite(ptTotalMeanAtLayer.x) && (
                      <g key={`diff-line-${i}`}>
                        <line
                          x1={ptMeanCenter.x}
                          y1={ptMeanCenter.y - 10}
                          x2={ptTotalMeanAtLayer.x}
                          y2={ptTotalMeanAtLayer.y - 10}
                          stroke={st.color}
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        />
                        <text
                          x={(ptMeanCenter.x + ptTotalMeanAtLayer.x) / 2}
                          y={ptMeanCenter.y - 13}
                          textAnchor="middle"
                          fill={st.color}
                          fontSize={fontScale(9)}
                          fontWeight="bold"
                        >
                          |x̄{toSub(i + 1)} - x̄| ={" "}
                          {(st.mean - strat.totalMean).toFixed(1)}
                        </text>
                      </g>
                    )}

                  {/* 该层均值交互拖拽点 */}
                  {vp && onParamChange && (
                    <InteractivePoint
                      cx={st.mean}
                      cy={st.yBase + 0.12}
                      scale={scale}
                      vp={vp}
                      onDrag={(newPos) => {
                        const targetX = Math.round(
                          Math.max(50, Math.min(100, newPos.x)),
                        );
                        onParamChange(st.key, targetX);
                      }}
                      color={st.color}
                      r={6}
                      fontScale={fontScale}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* 4. 底部总体方差合成 Stack Bar (数形结合拆解：【组内方差贡献】+【组间离差贡献】=【总体方差】) */}
      {(() => {
        const intraVar =
          strat.strataWeights[0] * strat.strataVars[0] +
          strat.strataWeights[1] * strat.strataVars[1] +
          strat.strataWeights[2] * strat.strataVars[2];
        const interMeanVar = Math.max(0, strat.totalVar - intraVar);

        const ptBarStart = mathToDesign(50, -0.04, scale);
        const totalWidthPx = 480;
        const barHeight = 24;

        const intraRatio = strat.totalVar > 0 ? intraVar / strat.totalVar : 0.5;
        const intraWidthPx = intraRatio * totalWidthPx;
        const interWidthPx = totalWidthPx - intraWidthPx;

        if (!Number.isFinite(ptBarStart.x) || !Number.isFinite(ptBarStart.y))
          return null;

        return (
          <g key="total-variance-stack-bar">
            {/* 背景框 */}
            <rect
              x={ptBarStart.x - 10}
              y={ptBarStart.y - 28}
              width={totalWidthPx + 160}
              height={54}
              rx={8}
              fill={withAlpha(MATH_COLORS.function, 0.06)}
              stroke={withAlpha(MATH_COLORS.function, 0.25)}
            />
            <text
              x={ptBarStart.x}
              y={ptBarStart.y - 10}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(11.5)}
              fontWeight="bold"
            >
              高考必考总体方差分解合成：s² = {strat.totalVar.toFixed(2)}
            </text>

            {/* 组内方差贡献柱 (蓝色) */}
            <rect
              x={ptBarStart.x}
              y={ptBarStart.y}
              width={intraWidthPx}
              height={barHeight}
              rx={4}
              fill={withAlpha(MATH_COLORS.function, 0.8)}
            />
            <text
              x={ptBarStart.x + intraWidthPx / 2}
              y={ptBarStart.y + 16}
              textAnchor="middle"
              fill={MATH_COLORS.white}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              组内散度贡献: {intraVar.toFixed(2)} (
              {((intraVar / Math.max(1, strat.totalVar)) * 100).toFixed(0)}
              %)
            </text>

            {/* 组间均值离差贡献柱 (橙色) */}
            <rect
              x={ptBarStart.x + intraWidthPx}
              y={ptBarStart.y}
              width={interWidthPx}
              height={barHeight}
              rx={4}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
            />
            {interWidthPx > 40 && (
              <text
                x={ptBarStart.x + intraWidthPx + interWidthPx / 2}
                y={ptBarStart.y + 16}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(10)}
                fontWeight="bold"
              >
                组间重心离差: {interMeanVar.toFixed(2)} (
                {((interMeanVar / Math.max(1, strat.totalVar)) * 100).toFixed(
                  0,
                )}
                %)
              </text>
            )}
          </g>
        );
      })()}
    </g>
  );
};
