/**
 * src/features/sequence/components/SequenceModelsAbsSumScene.tsx
 * 数列实验室 - 高考求和模型 3：绝对值变号求和 (零点分段与对称翻折)
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import type { AbsSumResult } from "@/math/sequence";
import { toSub } from "./SequenceText";

interface SequenceModelsAbsSumSceneProps {
  absSumData: AbsSumResult;
  a1: number;
  d: number;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function SequenceModelsAbsSumScene({
  absSumData,
  a1,
  d,
  scale,
  fontScale,
}: SequenceModelsAbsSumSceneProps) {
  const { terms, zeroPoint } = absSumData;
  const lineFn = (x: number) => a1 + (x - 1) * d;

  const barW = Math.min(30, Math.max(16, scale.scaleX * 0.42));

  return (
    <g className="sequence-scene-abs-sum">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 一次连续辅助直线 */}
      <FunctionGraph
        fn={lineFn}
        scale={scale}
        color={withAlpha(MATH_COLORS.sequence, 0.4)}
        strokeWidth={1.5}
        strokeDasharray="4,4"
      />

      {/* 2. 变号零点指示虚线与居中标注 */}
      {zeroPoint !== null && (
        <g className="zero-point-guide">
          <line
            x1={mathToDesign(zeroPoint, 0, scale).x}
            y1={mathToDesign(0, scale.yMin, scale).y}
            x2={mathToDesign(zeroPoint, 0, scale).x}
            y2={mathToDesign(0, scale.yMax, scale).y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          <circle
            cx={mathToDesign(zeroPoint, 0, scale).x}
            cy={mathToDesign(zeroPoint, 0, scale).y}
            r={5}
            fill={MATH_COLORS.paramPrimary}
          />
          {/* 零点浮动胶囊 */}
          <g className="zero-point-badge">
            <rect
              x={mathToDesign(zeroPoint, 0, scale).x - 60}
              y={mathToDesign(zeroPoint, 0, scale).y - 28}
              width={120}
              height={22}
              rx={11}
              fill={withAlpha(MATH_COLORS.white, 0.95)}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.2}
            />
            <text
              x={mathToDesign(zeroPoint, 0, scale).x}
              y={mathToDesign(zeroPoint, 0, scale).y - 13}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fill={MATH_COLORS.paramPrimary}
              fontWeight="bold"
            >
              变号零点 n₀ = {zeroPoint.toFixed(2)}
            </text>
          </g>
        </g>
      )}

      {/* 3. 各项柱体 (正项实心绿，负项向上翻折橙虚线) */}
      {terms.map((t) => {
        const ptOrig = mathToDesign(t.n, t.an, scale);
        const ptAbs = mathToDesign(t.n, t.absAn, scale);
        const ptZero = mathToDesign(t.n, 0, scale);

        return (
          <g key={`abs-term-${t.n}`}>
            {/* 负项在 x 轴下方的原虚线柱 */}
            {t.isNegative && (
              <g>
                <rect
                  x={ptOrig.x - barW / 2}
                  y={ptZero.y}
                  width={barW}
                  height={Math.max(2, Math.abs(ptOrig.y - ptZero.y))}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.12)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1}
                  strokeDasharray="3,2"
                  rx={2}
                />
                {/* 向上翻折箭头 */}
                <path
                  d={`M ${ptOrig.x} ${ptOrig.y} Q ${ptOrig.x + 14} ${(ptOrig.y + ptAbs.y) / 2} ${ptAbs.x} ${ptAbs.y}`}
                  fill="none"
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.2}
                  strokeDasharray="2,2"
                />
              </g>
            )}

            {/* 翻折后的绝对值实心柱 */}
            <rect
              x={ptAbs.x - barW / 2}
              y={Math.min(ptAbs.y, ptZero.y)}
              width={barW}
              height={Math.max(2, Math.abs(ptAbs.y - ptZero.y))}
              fill={withAlpha(
                t.isNegative
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.inequality,
                0.35,
              )}
              stroke={
                t.isNegative
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.inequality
              }
              strokeWidth={1.5}
              rx={3}
            />
            <circle
              cx={ptAbs.x}
              cy={ptAbs.y}
              r={4}
              fill={
                t.isNegative
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.inequality
              }
              stroke={MATH_COLORS.white}
              strokeWidth={1.2}
            />
            <text
              x={ptAbs.x}
              y={Math.min(ptAbs.y, ptZero.y) - 7}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fill={
                t.isNegative
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.inequality
              }
              fontWeight="bold"
            >
              |a{toSub(t.n)}| = {t.absAn.toFixed(1)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
