import type { DistributionComparisonResult } from "@/math/probabilityDistribution";
import { mathToDesign, type Point } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";

interface ProbabilityDistributionCompareSceneProps {
  comparisonResult: DistributionComparisonResult;
  scale: SceneScale;
  fontScale: (baseSize: number) => number;
  yAxisZero: Point;
  yAxisMax: Point;
  meanDesign: Point;
  mean: number;
  rightSafeMargin: number;
  halfBarWidthPx: number;
}

/** 双分布逼近同屏对比（超几何 vs 二项） */
export function ProbabilityDistributionCompareScene({
  comparisonResult,
  scale,
  fontScale,
  yAxisZero,
  yAxisMax,
  meanDesign,
  mean,
  rightSafeMargin,
  halfBarWidthPx,
}: ProbabilityDistributionCompareSceneProps) {
  return (
    <g className="transition-all duration-300">
      {/* 右上角图例 */}
      <g transform={`translate(${rightSafeMargin - 150}, ${yAxisMax.y + 16})`}>
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
        <g transform={`translate(${meanDesign.x}, ${yAxisZero.y + 30})`}>
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
  );
}
