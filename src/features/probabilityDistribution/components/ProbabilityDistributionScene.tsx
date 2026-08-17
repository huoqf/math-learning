import { useMemo } from "react";
import type {
  DistributionResult,
  DistributionComparisonResult,
  DecisionScenarioResult,
} from "@/math/probabilityDistribution";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";

interface ProbabilityDistributionSceneProps {
  distResult: DistributionResult;
  transformedDist?: DistributionResult;
  comparisonResult?: DistributionComparisonResult;
  decisionResult?: DecisionScenarioResult;
  studyMode:
    | "binomial"
    | "hypergeometric"
    | "compare"
    | "linear"
    | "decision"
    | "general";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (baseSize: number) => number;
  linearA?: number;
  linearB?: number;
}

export function ProbabilityDistributionScene({
  distResult,
  transformedDist,
  comparisonResult,
  decisionResult,
  studyMode,
  scale,
  fontScale,
  linearA = 2,
  linearB = 1,
}: ProbabilityDistributionSceneProps) {
  const { outcomes, mean, stdDev, maxP } = distResult;

  // 1. 固定稳定的纵轴 Y 标尺 0 ~ 1.0
  const yTicks = [0.2, 0.4, 0.6, 0.8, 1.0];

  // 确定基准线坐标
  const yAxisZero = mathToDesign(0, 0, scale);
  const yAxisMax = mathToDesign(0, 1.0, scale);

  // 动态计算 X 轴端点与安全边距
  const maxXVal = useMemo(() => {
    if (studyMode === "compare" && comparisonResult) {
      return comparisonResult.sampleN + 0.6;
    }
    if (studyMode === "decision") {
      return 4.8;
    }
    if (studyMode === "linear" && transformedDist) {
      const allX = [
        ...outcomes.map((o) => o.x),
        ...transformedDist.outcomes.map((o) => o.x),
      ];
      return Math.max(...allX) + 0.8;
    }
    return Math.max(...outcomes.map((o) => o.x), 0) + 0.6;
  }, [studyMode, comparisonResult, transformedDist, outcomes]);

  const minXVal = useMemo(() => {
    if (studyMode === "linear" && transformedDist) {
      const allX = [
        ...outcomes.map((o) => o.x),
        ...transformedDist.outcomes.map((o) => o.x),
      ];
      return Math.min(0, ...allX) - 0.6;
    }
    return -0.5;
  }, [studyMode, transformedDist, outcomes]);

  const rawAxisMin = mathToDesign(minXVal, 0, scale);
  const rawAxisMax = mathToDesign(maxXVal, 0, scale);

  // 保证 Y 轴刻度文本永远在左侧安全边距之内 (绝不截断)
  const leftSafeMargin = Math.max(38, rawAxisMin.x);
  const rightSafeMargin = Math.min(
    810,
    Math.max(rawAxisMax.x, leftSafeMargin + 200),
  );

  // 期望 E(X) 物理杠杆坐标
  const meanDesign = mathToDesign(mean, 0, scale);

  // 方差波动带 [E(X) - σ, E(X) + σ]
  const sigmaMin = Math.max(minXVal + 0.2, mean - stdDev);
  const sigmaMax = Math.min(maxXVal - 0.2, mean + stdDev);
  const sigmaMinDesign = mathToDesign(sigmaMin, 0, scale);
  const sigmaMaxDesign = mathToDesign(sigmaMax, 0, scale);

  // 柱体宽度
  const halfBarWidthPx = Math.max(10, Math.min(26, (0.34 * scale.scaleX) / 2));

  return (
    <g className="select-none">
      {/* ================= 模式 4：线性变换 Y=aX+b 专属上下分层双轨道设计 ================= */}
      {studyMode === "linear" && transformedDist ? (
        (() => {
          // 上层轨道 Y 坐标 (X 变量，基线位于 y=220px)
          const yTopBase = 220;
          // 下层轨道 Y 坐标 (Y 变量，基线位于 y=445px)
          const yBottomBase = 445;
          // 上下层柱高最大缩放像素
          const maxBarPx = 100;

          const meanXPos = mathToDesign(mean, 0, scale).x;
          const meanYVal = transformedDist.mean;
          const meanYPos = mathToDesign(meanYVal, 0, scale).x;

          return (
            <g className="transition-all duration-300">
              {/* --- 1. 上层轨道：原变量 X 轴系统 --- */}
              <line
                x1={leftSafeMargin - 15}
                y1={yTopBase}
                x2={rightSafeMargin + 25}
                y2={yTopBase}
                stroke={CANVAS_COLORS.axis}
                strokeWidth={2}
              />
              <polygon
                points={`${rightSafeMargin + 32},${yTopBase} ${rightSafeMargin + 22},${
                  yTopBase - 4
                } ${rightSafeMargin + 22},${yTopBase + 4}`}
                fill={CANVAS_COLORS.axis}
              />
              <text
                x={rightSafeMargin + 38}
                y={yTopBase + fontScale(4)}
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(12)}
                fontWeight="bold"
              >
                X (原变量)
              </text>

              {/* 上层方差波动带 */}
              {stdDev > 0.001 && (
                <rect
                  x={sigmaMinDesign.x}
                  y={yTopBase - maxBarPx - 10}
                  width={Math.max(4, sigmaMaxDesign.x - sigmaMinDesign.x)}
                  height={maxBarPx + 10}
                  fill={withAlpha(MATH_COLORS.asymptote, 0.08)}
                  stroke={withAlpha(MATH_COLORS.asymptote, 0.35)}
                  strokeDasharray="4 3"
                  rx={4}
                />
              )}

              {/* 上层 X 分布柱体 */}
              {outcomes.map((item, idx) => {
                const xPos = mathToDesign(item.x, 0, scale).x;
                const barH = Math.max(2, item.p * maxBarPx * 2.2);
                const isMax = Math.abs(item.p - maxP) < 1e-6 && item.p > 0;

                return (
                  <g key={`top-x-${idx}`}>
                    <rect
                      x={xPos - halfBarWidthPx}
                      y={yTopBase - barH}
                      width={halfBarWidthPx * 2}
                      height={barH}
                      fill={withAlpha(MATH_COLORS.barFill, isMax ? 0.95 : 0.75)}
                      stroke={
                        isMax ? MATH_COLORS.paramPrimary : MATH_COLORS.barFill
                      }
                      strokeWidth={isMax ? 2.2 : 1.4}
                      rx={3}
                    />
                    {item.p > 0.005 && (
                      <text
                        x={xPos}
                        y={yTopBase - barH - fontScale(5)}
                        fill={CANVAS_COLORS.labelText}
                        fontSize={fontScale(9.5)}
                        textAnchor="middle"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {item.p.toFixed(3)}
                      </text>
                    )}
                    {/* 上轨 X 刻度 */}
                    <text
                      x={xPos}
                      y={yTopBase + fontScale(15)}
                      fill={CANVAS_COLORS.labelText}
                      fontSize={fontScale(11)}
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {item.x}
                    </text>
                  </g>
                );
              })}

              {/* 上层 E(X) 支点 */}
              <g>
                <polygon
                  points={`${meanXPos},${yTopBase + 2} ${meanXPos - 6},${
                    yTopBase + 12
                  } ${meanXPos + 6},${yTopBase + 12}`}
                  fill={MATH_COLORS.tangentLine}
                />
                <g transform={`translate(${meanXPos}, ${yTopBase + 24})`}>
                  <rect
                    x={-40}
                    y={-9}
                    width={80}
                    height={18}
                    fill={MATH_COLORS.tangentLine}
                    rx={3}
                  />
                  <text
                    x={0}
                    y={3}
                    fill={CANVAS_COLORS.white}
                    fontSize={fontScale(9.5)}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    E(X) = {mean.toFixed(2)}
                  </text>
                </g>
              </g>

              {/* --- 2. 中间层：映射对应指引虚线 (从上轨 x_i 到底层 y_i) --- */}
              {outcomes.map((o, idx) => {
                const xPos = mathToDesign(o.x, 0, scale).x;
                const yMathVal = linearA * o.x + linearB;
                const yPos = mathToDesign(yMathVal, 0, scale).x;

                return (
                  <g key={`map-arrow-${idx}`}>
                    <line
                      x1={xPos}
                      y1={yTopBase + 36}
                      x2={yPos}
                      y2={yBottomBase - 120}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={1.4}
                      strokeDasharray="3 3"
                      strokeOpacity={0.7}
                    />
                  </g>
                );
              })}

              {/* --- 3. 下层轨道：变换后新变量 Y=aX+b 轴系统 --- */}
              <line
                x1={leftSafeMargin - 15}
                y1={yBottomBase}
                x2={rightSafeMargin + 25}
                y2={yBottomBase}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={2}
              />
              <polygon
                points={`${rightSafeMargin + 32},${yBottomBase} ${
                  rightSafeMargin + 22
                },${yBottomBase - 4} ${rightSafeMargin + 22},${yBottomBase + 4}`}
                fill={MATH_COLORS.paramSecondary}
              />
              <text
                x={rightSafeMargin + 38}
                y={yBottomBase + fontScale(4)}
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(12)}
                fontWeight="bold"
              >
                Y = aX+b
              </text>

              {/* 下层 Y 分布柱体 (与上轨完全一一对应) */}
              {outcomes.map((item, idx) => {
                const yMathVal = linearA * item.x + linearB;
                const yPos = mathToDesign(yMathVal, 0, scale).x;
                const barH = Math.max(2, item.p * maxBarPx * 2.2);

                return (
                  <g key={`bot-y-${idx}`}>
                    <rect
                      x={yPos - halfBarWidthPx}
                      y={yBottomBase - barH}
                      width={halfBarWidthPx * 2}
                      height={barH}
                      fill={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={1.5}
                      rx={3}
                    />
                    {item.p > 0.005 && (
                      <text
                        x={yPos}
                        y={yBottomBase - barH - fontScale(5)}
                        fill={MATH_COLORS.paramSecondary}
                        fontSize={fontScale(9.5)}
                        textAnchor="middle"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {item.p.toFixed(3)}
                      </text>
                    )}
                    {/* 下轨 y 刻度卡片 */}
                    <g transform={`translate(${yPos}, ${yBottomBase + 12})`}>
                      <rect
                        x={-20}
                        y={-7}
                        width={40}
                        height={14}
                        fill={MATH_COLORS.paramSecondary}
                        rx={2.5}
                      />
                      <text
                        x={0}
                        y={3}
                        fill={CANVAS_COLORS.white}
                        fontSize={fontScale(8.5)}
                        textAnchor="middle"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {yMathVal.toFixed(1)}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 下层 E(Y) 支点 */}
              <g>
                <polygon
                  points={`${meanYPos},${yBottomBase + 24} ${meanYPos - 6},${
                    yBottomBase + 34
                  } ${meanYPos + 6},${yBottomBase + 34}`}
                  fill={MATH_COLORS.paramPrimary}
                />
                <g transform={`translate(${meanYPos}, ${yBottomBase + 46})`}>
                  <rect
                    x={-46}
                    y={-9}
                    width={92}
                    height={18}
                    fill={MATH_COLORS.paramPrimary}
                    rx={3}
                  />
                  <text
                    x={0}
                    y={3}
                    fill={CANVAS_COLORS.white}
                    fontSize={fontScale(9.5)}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    E(Y) = {meanYVal.toFixed(2)}
                  </text>
                </g>
              </g>
            </g>
          );
        })()
      ) : (
        /* ================= 其它模式：标准单轨道设计 ================= */
        <>
          {/* 1. 背景静止网格与 Y 轴刻度 (左侧保留安全边距，绝对无截断) */}
          {yTicks.map((pVal) => {
            const linePos = mathToDesign(0, pVal, scale);
            return (
              <g key={`grid-y-${pVal}`}>
                <line
                  x1={leftSafeMargin}
                  y1={linePos.y}
                  x2={rightSafeMargin + 20}
                  y2={linePos.y}
                  stroke={CANVAS_COLORS.grid}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                {/* 纵轴概率刻度：紧贴 leftSafeMargin 左侧，右对齐 */}
                <text
                  x={leftSafeMargin - 8}
                  y={linePos.y + fontScale(4)}
                  fill={CANVAS_COLORS.labelText}
                  fontSize={fontScale(10.5)}
                  textAnchor="end"
                  fontWeight="600"
                  className="font-mono"
                >
                  {pVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* 2. 主 X 坐标轴与箭头 */}
          <line
            x1={leftSafeMargin - 10}
            y1={yAxisZero.y}
            x2={rightSafeMargin + 25}
            y2={yAxisZero.y}
            stroke={CANVAS_COLORS.axis}
            strokeWidth={2}
          />
          <polygon
            points={`${rightSafeMargin + 32},${yAxisZero.y} ${
              rightSafeMargin + 22
            },${yAxisZero.y - 4} ${rightSafeMargin + 22},${yAxisZero.y + 4}`}
            fill={CANVAS_COLORS.axis}
          />
          <text
            x={rightSafeMargin + 38}
            y={yAxisZero.y + fontScale(4)}
            fill={CANVAS_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {studyMode === "decision" ? "事件" : "x"}
          </text>

          {/* 3. 基础模式与超几何/一般模式的柱状图 */}
          {(studyMode === "binomial" ||
            studyMode === "hypergeometric" ||
            studyMode === "general") && (
            <>
              {/* 方差波动范围包络带 [E(X)-σ, E(X)+σ] */}
              {stdDev > 0.001 && (
                <g className="transition-all duration-300">
                  <rect
                    x={sigmaMinDesign.x}
                    y={yAxisMax.y - 12}
                    width={Math.max(4, sigmaMaxDesign.x - sigmaMinDesign.x)}
                    height={Math.abs(yAxisZero.y - (yAxisMax.y - 12))}
                    fill={withAlpha(MATH_COLORS.asymptote, 0.07)}
                    stroke={withAlpha(MATH_COLORS.asymptote, 0.35)}
                    strokeDasharray="4 3"
                    rx={6}
                  />
                  <text
                    x={(sigmaMinDesign.x + sigmaMaxDesign.x) / 2}
                    y={yAxisMax.y - 18}
                    fill={MATH_COLORS.asymptote}
                    fontSize={fontScale(10)}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    σ 波动区间 [{(mean - stdDev).toFixed(2)},{" "}
                    {(mean + stdDev).toFixed(2)}]
                  </text>
                </g>
              )}

              {/* 柱状分布列 */}
              {outcomes.map((item, idx) => {
                const topPos = mathToDesign(item.x, item.p, scale);
                const bottomPos = mathToDesign(item.x, 0, scale);
                const barHeight = Math.abs(bottomPos.y - topPos.y);
                const isMax = Math.abs(item.p - maxP) < 1e-6 && item.p > 0;

                let barColor: string = MATH_COLORS.barFill;
                if (studyMode === "hypergeometric")
                  barColor = MATH_COLORS.paramSecondary;
                if (isMax) barColor = MATH_COLORS.paramPrimary;

                return (
                  <g
                    key={`bar-${item.x}-${idx}`}
                    className="group cursor-pointer"
                  >
                    <rect
                      x={topPos.x - halfBarWidthPx}
                      y={topPos.y}
                      width={halfBarWidthPx * 2}
                      height={Math.max(barHeight, 2)}
                      fill={withAlpha(barColor, isMax ? 0.92 : 0.75)}
                      stroke={isMax ? MATH_COLORS.paramPrimary : barColor}
                      strokeWidth={isMax ? 2.5 : 1.5}
                      rx={4}
                      className="transition-all duration-300"
                    />

                    {/* 最值项金色皇冠标注 */}
                    {isMax && studyMode === "binomial" && (
                      <g transform={`translate(${topPos.x}, ${topPos.y - 24})`}>
                        <path
                          d="M -7 4 L -4 -4 L 0 0 L 4 -4 L 7 4 Z"
                          fill={MATH_COLORS.paramSecondary}
                        />
                        <text
                          x={0}
                          y={-6}
                          fill={MATH_COLORS.paramSecondary}
                          fontSize={fontScale(9)}
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          众数峰值
                        </text>
                      </g>
                    )}

                    {/* 柱顶概率数值 */}
                    {item.p > 0.0005 && (
                      <g transform={`translate(${topPos.x}, ${topPos.y - 8})`}>
                        <rect
                          x={-19}
                          y={-10}
                          width={38}
                          height={13}
                          fill={CANVAS_COLORS.white}
                          fillOpacity={0.94}
                          rx={3}
                        />
                        <text
                          x={0}
                          y={0}
                          fill={
                            isMax
                              ? MATH_COLORS.paramPrimary
                              : CANVAS_COLORS.labelText
                          }
                          fontSize={fontScale(10)}
                          textAnchor="middle"
                          fontWeight={isMax ? "bold" : "600"}
                          className="font-mono"
                        >
                          {item.p.toFixed(3)}
                        </text>
                      </g>
                    )}

                    {/* 横轴刻度取值 x_i 标注 */}
                    <text
                      x={bottomPos.x}
                      y={bottomPos.y + fontScale(16)}
                      fill={CANVAS_COLORS.labelText}
                      fontSize={fontScale(11)}
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {item.x}
                    </text>
                  </g>
                );
              })}

              {/* 期望 E(X) 物理平衡杠杆支点 */}
              <g className="transition-all duration-300">
                <line
                  x1={meanDesign.x}
                  y1={yAxisMax.y - 4}
                  x2={meanDesign.x}
                  y2={yAxisZero.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
                <polygon
                  points={`${meanDesign.x},${yAxisZero.y + 2} ${
                    meanDesign.x - 8
                  },${yAxisZero.y + 14} ${meanDesign.x + 8},${yAxisZero.y + 14}`}
                  fill={MATH_COLORS.tangentLine}
                  stroke={CANVAS_COLORS.white}
                  strokeWidth={1.5}
                />
                <g
                  transform={`translate(${meanDesign.x}, ${yAxisZero.y + 30})`}
                >
                  <rect
                    x={-42}
                    y={-12}
                    width={84}
                    height={22}
                    fill={MATH_COLORS.tangentLine}
                    rx={4}
                  />
                  <text
                    x={0}
                    y={3}
                    fill={CANVAS_COLORS.white}
                    fontSize={fontScale(11)}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    E(X) = {mean.toFixed(2)}
                  </text>
                </g>
              </g>
            </>
          )}

          {/* 4. 双分布逼近同屏对比 (超几何 vs 二项) */}
          {studyMode === "compare" && comparisonResult && (
            <g className="transition-all duration-300">
              {/* 右上角图例 */}
              <g
                transform={`translate(${rightSafeMargin - 150}, ${yAxisMax.y + 16})`}
              >
                <rect
                  x={0}
                  y={-4}
                  width={10}
                  height={8}
                  fill={MATH_COLORS.primary}
                  rx={2}
                />
                <text
                  x={14}
                  y={4}
                  fill={MATH_COLORS.primary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  超几何 H
                </text>
                <rect
                  x={75}
                  y={-4}
                  width={10}
                  height={8}
                  fill={MATH_COLORS.paramSecondary}
                  rx={2}
                />
                <text
                  x={89}
                  y={4}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  二项 B
                </text>
              </g>

              {/* 并排双柱体绘制 */}
              {comparisonResult.binomDist.outcomes.map((binomItem) => {
                const k = binomItem.x;
                const hyperItem = comparisonResult.hyperDist.outcomes.find(
                  (o) => o.x === k,
                );
                const pHyper = hyperItem?.p || 0;
                const pBinom = binomItem.p;

                const centerPos = mathToDesign(k, 0, scale);
                const w = Math.max(10, halfBarWidthPx * 0.85);

                const topHyper = mathToDesign(k, pHyper, scale);
                const heightHyper = Math.abs(centerPos.y - topHyper.y);

                const topBinom = mathToDesign(k, pBinom, scale);
                const heightBinom = Math.abs(centerPos.y - topBinom.y);

                return (
                  <g key={`comp-bar-${k}`}>
                    {/* 超几何柱体 */}
                    <rect
                      x={centerPos.x - w - 2}
                      y={topHyper.y}
                      width={w}
                      height={Math.max(heightHyper, 2)}
                      fill={withAlpha(MATH_COLORS.primary, 0.82)}
                      stroke={MATH_COLORS.primary}
                      strokeWidth={1.2}
                      rx={3}
                    />
                    {pHyper > 0.005 && (
                      <text
                        x={centerPos.x - w / 2 - 2}
                        y={topHyper.y - fontScale(5)}
                        fill={MATH_COLORS.primary}
                        fontSize={fontScale(9.5)}
                        textAnchor="middle"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {pHyper.toFixed(2)}
                      </text>
                    )}

                    {/* 二项分布柱体 */}
                    <rect
                      x={centerPos.x + 2}
                      y={topBinom.y}
                      width={w}
                      height={Math.max(heightBinom, 2)}
                      fill={withAlpha(MATH_COLORS.paramSecondary, 0.82)}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={1.2}
                      rx={3}
                    />
                    {pBinom > 0.005 && (
                      <text
                        x={centerPos.x + w / 2 + 2}
                        y={topBinom.y - fontScale(5)}
                        fill={MATH_COLORS.paramSecondary}
                        fontSize={fontScale(9.5)}
                        textAnchor="middle"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {pBinom.toFixed(2)}
                      </text>
                    )}

                    <text
                      x={centerPos.x}
                      y={centerPos.y + fontScale(16)}
                      fill={CANVAS_COLORS.labelText}
                      fontSize={fontScale(11)}
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {k}
                    </text>
                  </g>
                );
              })}

              {/* 期望重合支点 */}
              <g className="transition-all duration-300">
                <polygon
                  points={`${meanDesign.x},${yAxisZero.y + 2} ${
                    meanDesign.x - 8
                  },${yAxisZero.y + 14} ${meanDesign.x + 8},${yAxisZero.y + 14}`}
                  fill={MATH_COLORS.tangentLine}
                />
                <g
                  transform={`translate(${meanDesign.x}, ${yAxisZero.y + 30})`}
                >
                  <rect
                    x={-60}
                    y={-12}
                    width={120}
                    height={22}
                    fill={MATH_COLORS.tangentLine}
                    rx={4}
                  />
                  <text
                    x={0}
                    y={3}
                    fill={CANVAS_COLORS.white}
                    fontSize={fontScale(10.5)}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    共同期望 E={mean.toFixed(2)}
                  </text>
                </g>
              </g>
            </g>
          )}

          {/* 5. 决策模型对比 */}
          {studyMode === "decision" && decisionResult && (
            <g className="transition-all duration-300">
              <g
                transform={`translate(${rightSafeMargin - 150}, ${yAxisMax.y + 16})`}
              >
                <rect
                  x={0}
                  y={-4}
                  width={10}
                  height={8}
                  fill={MATH_COLORS.paramTertiary}
                  rx={2}
                />
                <text
                  x={14}
                  y={4}
                  fill={MATH_COLORS.paramTertiary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  方案 A
                </text>
                <rect
                  x={75}
                  y={-4}
                  width={10}
                  height={8}
                  fill={MATH_COLORS.paramPrimary}
                  rx={2}
                />
                <text
                  x={89}
                  y={4}
                  fill={MATH_COLORS.paramPrimary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  方案 B
                </text>
              </g>

              {(() => {
                const allItems = [
                  ...decisionResult.schemeADist.outcomes.map((o) => ({
                    ...o,
                    scheme: "A" as const,
                  })),
                  ...decisionResult.schemeBDist.outcomes.map((o) => ({
                    ...o,
                    scheme: "B" as const,
                  })),
                ];

                return allItems.map((item, idx) => {
                  const posXVal = 0.8 + idx * 1.3;
                  const topPos = mathToDesign(posXVal, item.p, scale);
                  const bPos = mathToDesign(posXVal, 0, scale);
                  const height = Math.abs(bPos.y - topPos.y);
                  const color =
                    item.scheme === "A"
                      ? MATH_COLORS.paramTertiary
                      : MATH_COLORS.paramPrimary;

                  return (
                    <g key={`dec-item-${idx}`}>
                      <rect
                        x={topPos.x - 20}
                        y={topPos.y}
                        width={40}
                        height={Math.max(height, 2)}
                        fill={withAlpha(color, 0.85)}
                        stroke={color}
                        strokeWidth={1.5}
                        rx={4}
                      />
                      <text
                        x={topPos.x}
                        y={topPos.y - fontScale(6)}
                        fill={color}
                        fontSize={fontScale(10)}
                        textAnchor="middle"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {(item.p * 100).toFixed(0)}%
                      </text>
                      <text
                        x={bPos.x}
                        y={bPos.y + fontScale(16)}
                        fill={CANVAS_COLORS.labelText}
                        fontSize={fontScale(10)}
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                });
              })()}
            </g>
          )}
        </>
      )}
    </g>
  );
}
