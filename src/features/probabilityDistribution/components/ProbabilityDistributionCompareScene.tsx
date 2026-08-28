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

/** 双分布逼近同屏对比（超几何 vs 二项，含收敛残差与方差修正因子量化） */
export function ProbabilityDistributionCompareScene({
  comparisonResult,
  scale,
  fontScale,
  yAxisZero,
  yAxisMax,
  meanDesign,
  mean,
  halfBarWidthPx,
}: ProbabilityDistributionCompareSceneProps) {
  const { varianceCorrectionFactor } = comparisonResult;
  const isNearConvergence = varianceCorrectionFactor > 0.95;

  return (
    <g className="transition-all duration-300">
      {/* 1. 顶部收敛进度看板指示 */}
      <g transform={`translate(${meanDesign.x}, ${yAxisMax.y - 18})`}>
        <rect
          x={-120}
          y={-14}
          width={240}
          height={24}
          fill={withAlpha(
            isNearConvergence ? MATH_COLORS.paramTertiary : MATH_COLORS.primary,
            0.1,
          )}
          stroke={
            isNearConvergence ? MATH_COLORS.paramTertiary : MATH_COLORS.primary
          }
          strokeWidth={1.2}
          rx={5}
        />
        <text
          x={0}
          y={3}
          fill={
            isNearConvergence ? MATH_COLORS.paramTertiary : MATH_COLORS.primary
          }
          fontSize={fontScale(10.5)}
          textAnchor="middle"
          fontWeight="bold"
        >
          方差修正系数 (N-n)/(N-1) = {varianceCorrectionFactor.toFixed(3)}{" "}
          {isNearConvergence ? "✔ 极限逼近" : "≈ 趋近中"}
        </text>
      </g>

      {/* 2. 并排双柱体绘制与残差 */}
      {comparisonResult.binomDist.outcomes.map((binomItem) => {
        const k = binomItem.x;
        const hyperItem = comparisonResult.hyperDist.outcomes.find(
          (o) => o.x === k,
        );
        const pHyper = hyperItem?.p || 0;
        const pBinom = binomItem.p;
        const diff = Math.abs(pHyper - pBinom);

        const centerPos = mathToDesign(k, 0, scale);
        const w = Math.max(10, halfBarWidthPx * 0.85);

        const topHyper = mathToDesign(k, pHyper, scale);
        const heightHyper = Math.abs(centerPos.y - topHyper.y);

        const topBinom = mathToDesign(k, pBinom, scale);
        const heightBinom = Math.abs(centerPos.y - topBinom.y);

        return (
          <g key={`comp-bar-${k}`}>
            {/* 超几何柱体 (深蓝色) */}
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

            {/* 二项分布柱体 (暖橙色) */}
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

            {/* 柱顶差值绝对值微标注 (Δp) */}
            {diff > 0.01 && (
              <text
                x={centerPos.x}
                y={Math.min(topHyper.y, topBinom.y) - fontScale(16)}
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(8.5)}
                textAnchor="middle"
                className="font-mono"
              >
                Δ={diff.toFixed(2)}
              </text>
            )}

            {/* 横轴刻度 */}
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

      {/* 3. 共同期望支点 */}
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
            meanDesign.x - 7
          },${yAxisZero.y + 12} ${meanDesign.x + 7},${yAxisZero.y + 12}`}
          fill={MATH_COLORS.tangentLine}
        />
        <g transform={`translate(${meanDesign.x}, ${yAxisZero.y + 30})`}>
          <rect
            x={-46}
            y={-10}
            width={92}
            height={20}
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
            E(X) = {mean.toFixed(2)}
          </text>
        </g>
      </g>
    </g>
  );
}
