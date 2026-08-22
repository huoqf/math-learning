/**
 * src/features/sequence/components/SequenceGeometricStaggerSumScene.tsx
 * 等比模型 - 专题 B: 错位相减法推导 (两行对齐、中间相消、保留首尾)
 */
import { MATH_COLORS, withAlpha } from "@/theme";
import type { ViewportInfo } from "@/hooks";
import { toSub, toSup } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceGeometricStaggerSumSceneProps {
  params: Record<string, number>;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
}

export function SequenceGeometricStaggerSumScene({
  params,
  vp,
  fontScale,
}: SequenceGeometricStaggerSumSceneProps) {
  const { N, geoData } = useSequenceParams(params);
  const { staggerData } = geoData;

  const cardWidth = Math.min(
    68,
    Math.max(44, (vp.centerX * 2 - 160) / (N + 2)),
  );
  const cardHeight = 36;
  const startX = 70;
  const row1Y = 160;
  const row2Y = 260;

  // toSub using top-level helper
  // toSup using top-level helper

  return (
    <g className="sequence-scene-stagger-sum">
      {/* 标题说明 */}
      <text
        x={vp.centerX}
        y={50}
        textAnchor="middle"
        fontSize={fontScale(12)}
        fill={MATH_COLORS.labelText}
        fontWeight="bold"
      >
        错位相减推导：Sₙ 与 q·Sₙ 逐项对齐相消
      </text>

      {/* 行 1: S_n 展开式 */}
      <text
        x={startX - 15}
        y={row1Y + cardHeight / 2 + 5}
        textAnchor="end"
        fontSize={fontScale(11)}
        fill={MATH_COLORS.sequenceSum}
        fontWeight="bold"
      >
        Sₙ =
      </text>
      {staggerData.snTerms.map((t, idx) => {
        const cx = startX + idx * (cardWidth + 8);
        const isHead = idx === 0;

        return (
          <g key={`sn-card-${t.n}`}>
            <rect
              x={cx}
              y={row1Y}
              width={cardWidth}
              height={cardHeight}
              rx={4}
              fill={withAlpha(
                isHead ? MATH_COLORS.paramPrimary : MATH_COLORS.sequenceSum,
                isHead ? 0.25 : 0.12,
              )}
              stroke={
                isHead ? MATH_COLORS.paramPrimary : MATH_COLORS.sequenceSum
              }
              strokeWidth={isHead ? 2 : 1}
            />
            <text
              x={cx + cardWidth / 2}
              y={row1Y + cardHeight / 2 + 4}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fill={isHead ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText}
              fontWeight={isHead ? "bold" : "normal"}
            >
              {isHead ? `a₁ (${t.val.toFixed(1)})` : `a${toSub(t.n)}`}
            </text>
            {idx < N - 1 && (
              <text
                x={cx + cardWidth + 4}
                y={row1Y + cardHeight / 2 + 5}
                textAnchor="middle"
                fontSize={fontScale(12)}
                fill={MATH_COLORS.labelText}
              >
                +
              </text>
            )}
          </g>
        );
      })}

      {/* 行 2: q S_n 错位展开式 (向右缩进一个卡片宽度) */}
      <text
        x={startX - 15}
        y={row2Y + cardHeight / 2 + 5}
        textAnchor="end"
        fontSize={fontScale(11)}
        fill={MATH_COLORS.sequenceSecondary}
        fontWeight="bold"
      >
        q·Sₙ =
      </text>
      {staggerData.qSnTerms.map((t, idx) => {
        const cx = startX + (idx + 1) * (cardWidth + 8); // 错开 1 格
        const isTail = idx === N - 1;

        return (
          <g key={`qsn-card-${t.n}`}>
            <rect
              x={cx}
              y={row2Y}
              width={cardWidth}
              height={cardHeight}
              rx={4}
              fill={withAlpha(
                isTail
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.sequenceSecondary,
                isTail ? 0.25 : 0.12,
              )}
              stroke={
                isTail
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.sequenceSecondary
              }
              strokeWidth={isTail ? 2 : 1}
            />
            <text
              x={cx + cardWidth / 2}
              y={row2Y + cardHeight / 2 + 4}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fill={isTail ? MATH_COLORS.paramSecondary : MATH_COLORS.labelText}
              fontWeight={isTail ? "bold" : "normal"}
            >
              {isTail ? `a₁q${toSup(N)}` : `a${toSub(t.n)}·q`}
            </text>
            {idx < N - 1 && (
              <text
                x={cx + cardWidth + 4}
                y={row2Y + cardHeight / 2 + 5}
                textAnchor="middle"
                fontSize={fontScale(12)}
                fill={MATH_COLORS.labelText}
              >
                +
              </text>
            )}

            {/* 中间项对消指示垂直虚线 */}
            {!isTail && (
              <g opacity={0.65}>
                <line
                  x1={cx + cardWidth / 2}
                  y1={row1Y + cardHeight}
                  x2={cx + cardWidth / 2}
                  y2={row2Y}
                  stroke={MATH_COLORS.sequenceStem}
                  strokeDasharray="3,3"
                  strokeWidth={1}
                />
                <text
                  x={cx + cardWidth / 2}
                  y={(row1Y + cardHeight + row2Y) / 2 + 4}
                  textAnchor="middle"
                  fontSize={fontScale(8.5)}
                  fill={MATH_COLORS.sequenceStem}
                >
                  相消
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* 相减相消总结条 */}
      <g className="stagger-result-summary">
        <line
          x1={startX - 20}
          y1={row2Y + cardHeight + 25}
          x2={startX + (N + 1) * (cardWidth + 8)}
          y2={row2Y + cardHeight + 25}
          stroke={MATH_COLORS.labelText}
          strokeWidth={1.5}
        />
        <rect
          x={startX}
          y={row2Y + cardHeight + 40}
          width={cardWidth * 2 + 10}
          height={cardHeight + 6}
          rx={6}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
        />
        <text
          x={startX + cardWidth + 5}
          y={row2Y + cardHeight + 65}
          textAnchor="middle"
          fontSize={fontScale(11)}
          fill={MATH_COLORS.paramPrimary}
          fontWeight="bold"
        >
          保留首项：+ a₁
        </text>

        <rect
          x={startX + N * (cardWidth + 8)}
          y={row2Y + cardHeight + 40}
          width={cardWidth * 2 + 10}
          height={cardHeight + 6}
          rx={6}
          fill={withAlpha(MATH_COLORS.paramSecondary, 0.15)}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.5}
        />
        <text
          x={startX + N * (cardWidth + 8) + cardWidth + 5}
          y={row2Y + cardHeight + 65}
          textAnchor="middle"
          fontSize={fontScale(11)}
          fill={MATH_COLORS.paramSecondary}
          fontWeight="bold"
        >
          保留末项：- a₁q{toSup(N)}
        </text>

        {/* 结论公式 */}
        <text
          x={vp.centerX}
          y={row2Y + cardHeight + 120}
          textAnchor="middle"
          fontSize={fontScale(13)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          (1 - q) · S{toSub(N)} = a₁ - a₁·q{toSup(N)} = a₁(1 - q{toSup(N)})
        </text>
      </g>
    </g>
  );
}
