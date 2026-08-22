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

/** 高考决策方案对比场景 */
export function ProbabilityDistributionDecisionScene({
  decisionResult,
  scale,
  fontScale,
  yAxisMax,
  rightSafeMargin,
}: ProbabilityDistributionDecisionSceneProps) {
  return (
    <g className="transition-all duration-300">
      <g transform={`translate(${rightSafeMargin - 150}, ${yAxisMax.y + 16})`}>
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
  );
}
