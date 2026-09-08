/**
 * src/features/sequence/components/SequenceArithmeticAbsSumScene.tsx
 * 等差数列 - 专题 E: 绝对值数列求和 Tn = sum |an|
 */
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface ArithmeticSubSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceArithmeticAbsSumScene({
  params,
  scale,
  fontScale,
  highlightN = 1,
  onSelectN,
}: ArithmeticSubSceneProps) {
  const { N, arithData } = useSequenceParams(params);

  const { terms, zeroPointExact } = arithData;

  const splitN = zeroPointExact !== null ? Math.floor(zeroPointExact) : 0;
  const splitPt =
    zeroPointExact !== null ? mathToDesign(zeroPointExact, 0, scale) : null;

  const maxTnVal = Math.max(...terms.map((t) => t.Tn), 5);

  return (
    <g className="sequence-scene-arithmetic-abs">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 变号分界垂直警示线 */}
      {splitPt &&
        zeroPointExact !== null &&
        zeroPointExact >= 1 &&
        zeroPointExact <= N && (
          <g className="split-boundary">
            <line
              x1={splitPt.x}
              y1={mathToDesign(0, -4, scale).y}
              x2={splitPt.x}
              y2={mathToDesign(0, maxTnVal + 1, scale).y}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.2}
              strokeDasharray="4,3"
            />
            <text
              x={splitPt.x}
              y={mathToDesign(0, maxTnVal + 1, scale).y - 6}
              textAnchor="middle"
              fontSize={fontScale(9)}
              fill={MATH_COLORS.paramPrimary}
              fontWeight="bold"
            >
              分界点 m={splitN}
            </text>
          </g>
        )}

      {/* 2. Tn 折线 (金色) 与 Sn 折线 (紫色虚线) */}
      <g className="sum-curves">
        {terms.map((t, idx) => {
          if (idx === 0) return null;
          const prev = terms[idx - 1];
          const ptTn1 = mathToDesign(prev.n, prev.Tn, scale);
          const ptTn2 = mathToDesign(t.n, t.Tn, scale);
          const ptSn1 = mathToDesign(prev.n, prev.Sn, scale);
          const ptSn2 = mathToDesign(t.n, t.Sn, scale);

          return (
            <g key={`curve-seg-${t.n}`}>
              <line
                x1={ptTn1.x}
                y1={ptTn1.y}
                x2={ptTn2.x}
                y2={ptTn2.y}
                stroke={MATH_COLORS.sequenceHighlight}
                strokeWidth={1.8}
              />
              <line
                x1={ptSn1.x}
                y1={ptSn1.y}
                x2={ptSn2.x}
                y2={ptSn2.y}
                stroke={MATH_COLORS.sequenceSum}
                strokeWidth={1.2}
                strokeDasharray="3,3"
              />
            </g>
          );
        })}
      </g>

      {/* 3. 各项柱体与散点 (Tn 只在首、转折点、末项显示标注) */}
      {terms.map((t) => {
        const isNeg = t.an < 0;
        const ptBase = mathToDesign(t.n, 0, scale);
        const ptOrig = mathToDesign(t.n, t.an, scale);
        const ptAbs = mathToDesign(t.n, t.absAn, scale);
        const ptTn = mathToDesign(t.n, t.Tn, scale);
        const ptSn = mathToDesign(t.n, t.Sn, scale);
        const isHighlighted = t.n === highlightN;
        const isKeyPoint =
          t.n === 1 || t.n === splitN || t.n === N || isHighlighted;

        return (
          <g
            key={`abs-term-${t.n}`}
            onClick={() => onSelectN?.(t.n)}
            className="cursor-pointer"
          >
            {/* 负项在第四象限的虚线原项 */}
            {isNeg && (
              <g opacity={0.35}>
                <rect
                  x={ptBase.x - 8}
                  y={Math.min(ptBase.y, ptOrig.y)}
                  width={16}
                  height={Math.abs(ptBase.y - ptOrig.y)}
                  fill="none"
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                <circle
                  cx={ptOrig.x}
                  cy={ptOrig.y}
                  r={2.5}
                  fill="none"
                  stroke={MATH_COLORS.paramPrimary}
                />
              </g>
            )}

            {/* 第一象限绝对值实体柱 */}
            <rect
              x={ptBase.x - 8}
              y={Math.min(ptBase.y, ptAbs.y)}
              width={16}
              height={Math.abs(ptBase.y - ptAbs.y)}
              fill={withAlpha(
                isHighlighted
                  ? MATH_COLORS.sequenceHighlight
                  : isNeg
                    ? MATH_COLORS.sequenceHighlight
                    : MATH_COLORS.sequence,
                0.25,
              )}
              stroke={
                isHighlighted
                  ? MATH_COLORS.sequenceHighlight
                  : isNeg
                    ? MATH_COLORS.sequenceHighlight
                    : MATH_COLORS.sequence
              }
              strokeWidth={isHighlighted ? 1.8 : 1}
              rx={2}
            />

            {/* Tn 绝对值累计和散点 */}
            <circle
              cx={ptTn.x}
              cy={ptTn.y}
              r={isKeyPoint ? 4 : 2.5}
              fill={MATH_COLORS.sequenceHighlight}
              stroke={MATH_COLORS.white}
              strokeWidth={1.2}
            />
            {isKeyPoint && (
              <text
                x={ptTn.x}
                y={ptTn.y - 7}
                textAnchor="middle"
                fontSize={fontScale(8.5)}
                fill={MATH_COLORS.sequenceHighlight}
                fontWeight="bold"
              >
                T{toSub(t.n)} = {t.Tn.toFixed(1)}
              </text>
            )}

            {/* Sn 散点 */}
            <circle
              cx={ptSn.x}
              cy={ptSn.y}
              r={2.5}
              fill={MATH_COLORS.sequenceSum}
            />
          </g>
        );
      })}
    </g>
  );
}
