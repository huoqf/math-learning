import type { DecisionScenarioResult } from "@/math/probabilityDistribution";
import { mathToDesign, type Point } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { DECISION_BAR_FIRST_X, DECISION_BAR_STRIDE } from "./modeConfig";
import { formatMathNumber } from "@/utils/mathFormat";

interface ProbabilityDistributionDecisionSceneProps {
  decisionResult: DecisionScenarioResult;
  scale: SceneScale;
  fontScale: (baseSize: number) => number;
  yAxisMax: Point;
  rightSafeMargin: number;
  activeStep?: number;
}

/** 高考决策方案对比场景（展示各状态概率与决策优劣判定） */
export function ProbabilityDistributionDecisionScene({
  decisionResult,
  scale,
  fontScale,
  yAxisMax,
  activeStep,
}: ProbabilityDistributionDecisionSceneProps) {
  const isQuality = decisionResult.scenario === "quality";
  const isA_Better = isQuality
    ? decisionResult.schemeADist.mean < decisionResult.schemeBDist.mean // 质检选成本低
    : decisionResult.schemeADist.mean > decisionResult.schemeBDist.mean; // 投资选收益高

  // 期望函数交点分析图参数 (从当前分布反推连续调控概率 p 与临界阈值 p*)
  const currentP = isQuality
    ? Math.max(
        0.01,
        Math.min(
          0.2,
          (decisionResult.schemeADist.outcomes[2]?.p ?? 0.064) / 0.8,
        ),
      )
    : Math.max(
        0.1,
        Math.min(0.9, decisionResult.schemeBDist.outcomes[1]?.p ?? 0.5),
      );
  const pMin = isQuality ? 0.01 : 0.1;
  const pMax = isQuality ? 0.2 : 0.9;
  const pThreshold = isQuality ? 0.19 : 14 / 30;
  const eMin = isQuality ? 0 : -8;
  const eMax = isQuality ? 10 : 18;
  const evalEA = (p: number) => (isQuality ? 0.4 + 40 * p : 4);
  const evalEB = (p: number) => (isQuality ? 8 : 30 * p - 10);

  // 右侧期望曲线子图画布坐标框 (避让左半区柱状图、右上角图例及底部表格)
  const plotX = 528;
  const plotY = 148;
  const plotW = 264;
  const plotH = 196;
  const chartDim = activeStep === undefined || activeStep === 3 ? 1 : 0.4;
  const barsDim = activeStep === undefined || activeStep !== 3 ? 1 : 0.45;
  const padL = 36;
  const padR = 16;
  const padT = 32;
  const padB = 34;
  const innerW = plotW - padL - padR;
  const innerH = plotH - padT - padB;
  const toChartX = (p: number) =>
    plotX + padL + ((p - pMin) / (pMax - pMin)) * innerW;
  const toChartY = (e: number) =>
    plotY + padT + (1 - (e - eMin) / (eMax - eMin)) * innerH;

  const threshX = toChartX(pThreshold);
  const threshY = toChartY(evalEA(pThreshold));
  const curX = toChartX(currentP);
  const curY_A = toChartY(evalEA(currentP));
  const curY_B = toChartY(evalEB(currentP));

  return (
    <g className="transition-all duration-300">
      {/* 顶部决策结论横幅 */}
      <g transform={`translate(285, ${yAxisMax.y - 18})`}>
        <rect
          x={-140}
          y={-14}
          width={280}
          height={26}
          fill={withAlpha(
            isA_Better ? MATH_COLORS.paramTertiary : MATH_COLORS.paramPrimary,
            0.1,
          )}
          stroke={
            isA_Better ? MATH_COLORS.paramTertiary : MATH_COLORS.paramPrimary
          }
          strokeWidth={1.2}
          rx={5}
        />
        <text
          x={0}
          y={4}
          fill={
            isA_Better ? MATH_COLORS.paramTertiary : MATH_COLORS.paramPrimary
          }
          fontSize={fontScale(11)}
          textAnchor="middle"
          fontWeight="bold"
        >
          {decisionResult.scenario === "quality"
            ? `最优决策: 推荐${isA_Better ? "【方案A: 抽检】" : "【方案B: 全检】"} (期望成本更低)`
            : `最优决策: 推荐${isA_Better ? "【方案A: 理财】" : "【方案B: 股票】"} (期望收益更高)`}
        </text>
      </g>

      {/* 柱状项渲染 */}
      <g opacity={barsDim}>
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
            const posXVal = DECISION_BAR_FIRST_X + idx * DECISION_BAR_STRIDE;
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
                  x={topPos.x - 24}
                  y={topPos.y}
                  width={48}
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
                  fontSize={fontScale(10.5)}
                  textAnchor="middle"
                  fontWeight="bold"
                  className="font-mono"
                >
                  {formatMathNumber(Math.round(item.p * 100))}%
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

      {/* 右侧：方案期望曲线 E_A(p) vs E_B(p) 与临界阈值 p* 交点决策图 */}
      <g opacity={chartDim}>
        <rect
          x={plotX}
          y={plotY}
          width={plotW}
          height={plotH}
          rx={10}
          fill={CANVAS_COLORS.white}
          stroke={MATH_COLORS.axis}
          strokeWidth={1.2}
        />
        <text
          x={plotX + plotW / 2}
          y={plotY + 20}
          textAnchor="middle"
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.labelText}
        >
          {isQuality
            ? "期望成本函数与平衡点 p* = 19%"
            : "期望收益率与平衡点 p* ≈ 46.7%"}
        </text>
        {/* 坐标轴 */}
        <line
          x1={plotX + padL}
          y1={plotY + padT}
          x2={plotX + padL}
          y2={plotY + padT + innerH}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1.2}
        />
        <line
          x1={plotX + padL}
          y1={plotY + padT + innerH}
          x2={plotX + padL + innerW}
          y2={plotY + padT + innerH}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1.2}
        />
        {/* 方案 A 直线 E_A(p) */}
        <line
          x1={toChartX(pMin)}
          y1={toChartY(evalEA(pMin))}
          x2={toChartX(pMax)}
          y2={toChartY(evalEA(pMax))}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={2.2}
        />
        {/* 方案 B 直线 E_B(p) */}
        <line
          x1={toChartX(pMin)}
          y1={toChartY(evalEB(pMin))}
          x2={toChartX(pMax)}
          y2={toChartY(evalEB(pMax))}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2.2}
        />
        {/* 临界交点 p* 垂线与交点圆 */}
        <line
          x1={threshX}
          y1={plotY + padT}
          x2={threshX}
          y2={plotY + padT + innerH}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.2}
          strokeDasharray="4 3"
        />
        <circle
          cx={threshX}
          cy={threshY}
          r={4}
          fill={MATH_COLORS.paramSecondary}
          stroke={CANVAS_COLORS.white}
          strokeWidth={1.2}
        />
        <text
          x={threshX}
          y={plotY + padT + innerH + 14}
          textAnchor="middle"
          fontSize={fontScale(9.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramSecondary}
        >
          p*={isQuality ? "19%" : "46.7%"}
        </text>
        {/* 当前参数 p 实时垂直位置指示 */}
        <line
          x1={curX}
          y1={plotY + padT}
          x2={curX}
          y2={plotY + padT + innerH}
          stroke={MATH_COLORS.primary}
          strokeWidth={1.2}
          strokeOpacity={0.5}
        />
        <circle
          cx={curX}
          cy={curY_A}
          r={3.5}
          fill={MATH_COLORS.paramTertiary}
        />
        <circle cx={curX} cy={curY_B} r={3.5} fill={MATH_COLORS.paramPrimary} />
        {/* 底部图例与刻度 */}
        <text
          x={plotX + padL + 2}
          y={plotY + plotH - 8}
          fontSize={fontScale(9.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramTertiary}
        >
          ● 方案A: E={formatMathNumber(evalEA(currentP))}
        </text>
        <text
          x={plotX + plotW - 10}
          y={plotY + plotH - 8}
          textAnchor="end"
          fontSize={fontScale(9.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          ● 方案B: E={formatMathNumber(evalEB(currentP))}
        </text>
      </g>
    </g>
  );
}
