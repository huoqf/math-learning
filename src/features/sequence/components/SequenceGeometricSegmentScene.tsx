/**
 * src/features/sequence/components/SequenceGeometricSegmentScene.tsx
 * 等比模型 - 专题 C: 等长片段性质 (Sk, S2k-Sk, S3k-S2k 等比条带)
 */
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import { toSup } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceGeometricSegmentSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (size: number) => number;
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceGeometricSegmentScene({
  params,
  scale,
  fontScale,
  highlightN = 1,
  onSelectN,
}: SequenceGeometricSegmentSceneProps) {
  const { kSegment, geoData } = useSequenceParams(params);
  const { terms, segmentedSums } = geoData;

  const segColors = [
    MATH_COLORS.sequence,
    MATH_COLORS.sequenceSecondary,
    MATH_COLORS.sequenceHighlight,
    MATH_COLORS.inequality,
  ];
  const validK = segmentedSums?.k ?? kSegment;
  // toSup using top-level helper

  return (
    <g className="sequence-scene-geometric-segment">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 分组柱体与连线 */}
      {terms.map((t) => {
        const segIdx = Math.floor((t.n - 1) / validK);
        const color = segColors[segIdx % segColors.length];
        const ptBase = mathToDesign(t.n, 0, scale);
        const ptTop = mathToDesign(t.n, t.an, scale);
        const isHighlighted = t.n === highlightN;

        return (
          <g
            key={`geo-seg-term-${t.n}`}
            onClick={() => onSelectN?.(t.n)}
            className="cursor-pointer"
          >
            <rect
              x={ptBase.x - 7}
              y={Math.min(ptBase.y, ptTop.y)}
              width={14}
              height={Math.abs(ptBase.y - ptTop.y)}
              fill={withAlpha(color, isHighlighted ? 0.45 : 0.22)}
              stroke={color}
              strokeWidth={isHighlighted ? 2 : 1}
              rx={2}
            />
            <circle
              cx={ptTop.x}
              cy={ptTop.y}
              r={isHighlighted ? 4.5 : 3}
              fill={color}
              stroke={MATH_COLORS.white}
              strokeWidth={1.2}
            />
          </g>
        );
      })}

      {/* 2. 各片段和顶部条带与公比倍数弧线 */}
      {segmentedSums &&
        segmentedSums.segments.map((seg, idx) => {
          const color = segColors[(seg.segmentIndex - 1) % segColors.length];
          const ptStart = mathToDesign(seg.startN - 0.35, 0, scale);
          const ptEnd = mathToDesign(seg.endN + 0.35, 0, scale);
          const maxAnInSeg = Math.max(
            ...terms
              .slice(seg.startN - 1, seg.endN)
              .map((t) => Math.max(0, t.an)),
          );
          const topY = mathToDesign(0, maxAnInSeg + 1, scale).y;

          return (
            <g key={`geo-seg-box-${seg.segmentIndex}`}>
              {/* 片段顶部水平条 */}
              <line
                x1={ptStart.x}
                y1={topY}
                x2={ptEnd.x}
                y2={topY}
                stroke={color}
                strokeWidth={2}
              />
              <line
                x1={ptStart.x}
                y1={topY - 3}
                x2={ptStart.x}
                y2={topY + 3}
                stroke={color}
                strokeWidth={2}
              />
              <line
                x1={ptEnd.x}
                y1={topY - 3}
                x2={ptEnd.x}
                y2={topY + 3}
                stroke={color}
                strokeWidth={2}
              />

              {/* 片段和数值 */}
              <text
                x={(ptStart.x + ptEnd.x) / 2}
                y={topY - 8}
                textAnchor="middle"
                fontSize={fontScale(10)}
                fill={color}
                fontWeight="bold"
              >
                第 {seg.segmentIndex} 片段和 = {seg.sumValue.toFixed(2)}
              </text>

              {/* 跨段比例标注弧线 */}
              {idx > 0 && (
                <g className="ratio-arrow">
                  <path
                    d={`M ${ptStart.x - 30},${topY - 18} Q ${ptStart.x},${topY - 35} ${ptStart.x + 30},${topY - 18}`}
                    fill="none"
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1.5}
                    strokeDasharray="3,2"
                  />
                  <text
                    x={ptStart.x}
                    y={topY - 38}
                    textAnchor="middle"
                    fontSize={fontScale(9.5)}
                    fill={MATH_COLORS.sequenceHighlight}
                    fontWeight="bold"
                  >
                    × q{toSup(validK)} ({segmentedSums.ratio.toFixed(2)})
                  </text>
                </g>
              )}
            </g>
          );
        })}

      {/* 2. 项数不足成段时的空态引导卡 */}
      {!segmentedSums && (
        <g
          transform={`translate(${mathToDesign((1 + terms.length) / 2, 0, scale).x}, 40)`}
        >
          <rect
            x={-175}
            y={-20}
            width={350}
            height={46}
            rx={8}
            fill={withAlpha(MATH_COLORS.white, 0.95)}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.2}
            strokeDasharray="4,3"
          />
          <text
            x={0}
            y={-2}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            项数不足成段 (当前 N={terms.length}, k={validK})
          </text>
          <text
            x={0}
            y={15}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={MATH_COLORS.textMuted}
          >
            至少需要 N ≥ 2k ({2 * validK} 项) 才能形成连续两组等长片段和
          </text>
        </g>
      )}
    </g>
  );
}
