/**
 * src/features/sequence/components/SequenceModelsGroupedScene.tsx
 * 数列实验室 - 高考求和模型 4：分组转化求和法 (等差 + 等比层叠)
 */
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import type { GroupedResult } from "@/math/sequence";
import { toSub } from "./SequenceText";

interface SequenceModelsGroupedSceneProps {
  groupedData: GroupedResult;
  vp: ViewportInfo;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function SequenceModelsGroupedScene({
  groupedData,
  vp,
  scale,
  fontScale,
}: SequenceModelsGroupedSceneProps) {
  const terms = groupedData.terms;
  const bannerY = vp.designTop + 24;

  const barW = Math.min(30, Math.max(16, scale.scaleX * 0.42));

  return (
    <g className="sequence-scene-grouped">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 图例提示栏 */}
      <g className="grouped-legend">
        <rect
          x={vp.centerX - 160}
          y={bannerY}
          width={320}
          height={26}
          rx={13}
          fill={withAlpha(MATH_COLORS.white, 0.95)}
          stroke={withAlpha(MATH_COLORS.sequenceHighlight, 0.5)}
          strokeWidth={1.2}
        />
        <rect
          x={vp.centerX - 140}
          y={bannerY + 7}
          width={12}
          height={12}
          rx={2}
          fill={withAlpha(MATH_COLORS.sequence, 0.5)}
          stroke={MATH_COLORS.sequence}
        />
        <text
          x={vp.centerX - 122}
          y={bannerY + 17}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.sequence}
          fontWeight="bold"
        >
          等差分量 aₙ
        </text>
        <rect
          x={vp.centerX + 15}
          y={bannerY + 7}
          width={12}
          height={12}
          rx={2}
          fill={withAlpha(MATH_COLORS.sequenceSecondary, 0.6)}
          stroke={MATH_COLORS.sequenceSecondary}
        />
        <text
          x={vp.centerX + 33}
          y={bannerY + 17}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.sequenceSecondary}
          fontWeight="bold"
        >
          等比分量 bₙ
        </text>
      </g>

      {terms.map((t) => {
        const ptAn = mathToDesign(t.n, t.an, scale);
        const ptCn = mathToDesign(t.n, t.cn, scale);
        const ptZero = mathToDesign(t.n, 0, scale);

        const hAn = Math.abs(ptAn.y - ptZero.y);
        const hBn = Math.abs(ptCn.y - ptAn.y);

        return (
          <g key={`grp-${t.n}`}>
            {/* 蓝色底柱 (等差部分 a_n) */}
            <rect
              x={ptAn.x - barW / 2}
              y={Math.min(ptAn.y, ptZero.y)}
              width={barW}
              height={Math.max(2, hAn)}
              fill={withAlpha(MATH_COLORS.sequence, 0.35)}
              stroke={MATH_COLORS.sequence}
              strokeWidth={1.5}
              rx={2}
            />

            {/* 紫色上柱 (等比部分 b_n) */}
            <rect
              x={ptCn.x - barW / 2}
              y={Math.min(ptCn.y, ptAn.y)}
              width={barW}
              height={Math.max(2, hBn)}
              fill={withAlpha(MATH_COLORS.sequenceSecondary, 0.45)}
              stroke={MATH_COLORS.sequenceSecondary}
              strokeWidth={1.5}
              rx={2}
            />

            <text
              x={ptCn.x}
              y={Math.min(ptCn.y, ptAn.y, ptZero.y) - 6}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fill={MATH_COLORS.sequenceSum}
              fontWeight="bold"
            >
              c{toSub(t.n)} = a{toSub(t.n)} + b{toSub(t.n)} ({t.cn.toFixed(1)})
            </text>
          </g>
        );
      })}
    </g>
  );
}
