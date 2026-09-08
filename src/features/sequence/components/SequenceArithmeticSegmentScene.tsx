/**
 * src/features/sequence/components/SequenceArithmeticSegmentScene.tsx
 * 等差数列 - 专题 D: 等长片段和性质 (Sk, S2k-Sk, S3k-S2k 等差条带)
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

export function SequenceArithmeticSegmentScene({
  params,
  scale,
  fontScale,
}: ArithmeticSubSceneProps) {
  const { kSegment, arithData } = useSequenceParams(params);

  const { terms, segmentedSums } = arithData;

  const segColors = [
    MATH_COLORS.sequence,
    MATH_COLORS.paramTertiary,
    MATH_COLORS.sequenceSum,
    MATH_COLORS.paramSecondary,
  ];

  // 获取当前项柱的最大最高点，卡片顶就落在最高点上方
  const maxTermAn = Math.max(...terms.map((t) => t.an), 1);
  const minTermAn = Math.min(...terms.map((t) => t.an), -1);

  return (
    <g className="sequence-scene-arithmetic-segment">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 各片段背景卡片包裹框 */}
      {segmentedSums?.segments.map((seg, sIdx) => {
        const ptStart = mathToDesign(seg.startN - 0.4, 0, scale);
        const ptEnd = mathToDesign(seg.endN + 0.4, 0, scale);
        const color = segColors[sIdx % segColors.length];
        const cardX = ptStart.x;
        const cardW = ptEnd.x - ptStart.x;
        const cardTopY = mathToDesign(0, maxTermAn + 2.2, scale).y;
        const cardBottomY = mathToDesign(0, minTermAn - 0.8, scale).y;
        const cardH = Math.abs(cardBottomY - cardTopY);

        return (
          <g key={`seg-card-${seg.segmentIndex}`}>
            <rect
              x={cardX}
              y={cardTopY}
              width={cardW}
              height={cardH}
              fill={withAlpha(color, 0.06)}
              stroke={withAlpha(color, 0.3)}
              strokeWidth={1.2}
              strokeDasharray="4,3"
              rx={4}
            />
            {/* 紧凑单行标题 */}
            <text
              x={cardX + cardW / 2}
              y={cardTopY + 13}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fill={color}
              fontWeight="bold"
            >
              A{toSub(seg.segmentIndex)} = {seg.sumValue.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* 2. 各项柱体与散点 */}
      {terms.map((t) => {
        const segIdx = Math.floor((t.n - 1) / kSegment);
        const color = segColors[segIdx % segColors.length];
        const pt0 = mathToDesign(t.n - 0.2, 0, scale);
        const pt1 = mathToDesign(t.n + 0.2, t.an, scale);
        const x = Math.min(pt0.x, pt1.x);
        const y = Math.min(pt0.y, pt1.y);
        const w = Math.abs(pt1.x - pt0.x);
        const h = Math.abs(pt1.y - pt0.y);
        const posAn = mathToDesign(t.n, t.an, scale);

        return (
          <g key={`seg-term-${t.n}`}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={withAlpha(color, 0.3)}
              stroke={color}
              strokeWidth={1.2}
              rx={2}
            />
            <circle
              cx={posAn.x}
              cy={posAn.y}
              r={3}
              fill={color}
              stroke={MATH_COLORS.white}
              strokeWidth={1.2}
            />
            <text
              x={posAn.x}
              y={t.an >= 0 ? posAn.y - 6 : posAn.y + 13}
              textAnchor="middle"
              fontSize={fontScale(8.5)}
              fill={color}
            >
              {t.an.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* 3. 相邻片段之间的差值指示 (就近贴在卡片顶上方) */}
      {segmentedSums && segmentedSums.segments.length >= 2 && (
        <g className="segment-diff-arrows">
          {segmentedSums.segments.slice(0, -1).map((seg, idx) => {
            const nextSeg = segmentedSums.segments[idx + 1];
            const pt1 = mathToDesign(
              (seg.startN + seg.endN) / 2,
              maxTermAn + 2.2,
              scale,
            );
            const pt2 = mathToDesign(
              (nextSeg.startN + nextSeg.endN) / 2,
              maxTermAn + 2.2,
              scale,
            );

            return (
              <g key={`seg-diff-${idx}`}>
                <path
                  d={`M ${pt1.x} ${pt1.y} Q ${(pt1.x + pt2.x) / 2} ${pt1.y - 10} ${pt2.x} ${pt2.y}`}
                  fill="none"
                  stroke={MATH_COLORS.sequenceHighlight}
                  strokeWidth={1.2}
                />
                <text
                  x={(pt1.x + pt2.x) / 2}
                  y={pt1.y - 12}
                  textAnchor="middle"
                  fontSize={fontScale(9)}
                  fill={MATH_COLORS.sequenceHighlight}
                  fontWeight="bold"
                >
                  + k²·d ={" "}
                  {segmentedSums.diff > 0
                    ? `+${segmentedSums.diff}`
                    : `${segmentedSums.diff}`}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}
