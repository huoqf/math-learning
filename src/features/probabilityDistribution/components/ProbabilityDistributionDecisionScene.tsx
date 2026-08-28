import type { DecisionScenarioResult } from "@/math/probabilityDistribution";
import { mathToDesign, type Point } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";

interface ProbabilityDistributionDecisionSceneProps {
  decisionResult: DecisionScenarioResult;
  scale: SceneScale;
  fontScale: (baseSize: number) => number;
  yAxisMax: Point;
  rightSafeMargin: number;
}

/** 高考决策方案对比场景（展示各状态概率与决策优劣判定） */
export function ProbabilityDistributionDecisionScene({
  decisionResult,
  scale,
  fontScale,
  yAxisMax,
}: ProbabilityDistributionDecisionSceneProps) {
  const isA_Better =
    decisionResult.scenario === "quality"
      ? decisionResult.schemeADist.mean < decisionResult.schemeBDist.mean // 质检选成本低
      : decisionResult.schemeADist.mean > decisionResult.schemeBDist.mean; // 投资选收益高

  return (
    <g className="transition-all duration-300">
      {/* 顶部决策结论横幅 */}
      <g transform={`translate(420, ${yAxisMax.y - 18})`}>
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
  );
}
