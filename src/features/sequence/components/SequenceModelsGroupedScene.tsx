/**
 * src/features/sequence/components/SequenceModelsGroupedScene.tsx
 * 数列实验室 - 高考求和模型 4：分组转化求和法 (等差 + 等比层叠)
 */
import { CoordinateGrid } from "@/components/Math";
import { CANVAS_PRESETS, MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { SceneScale, ViewportInfo } from "@/hooks";
import type { GroupedResult } from "@/math/sequence";
import { toSub } from "./SequenceText";
import { AxisBreakBanner, SequenceTruncatedBar } from "./SequenceTruncatedBar";

const DESIGN_CENTER_X = CANVAS_PRESETS.full.width / 2;

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
  const plotTopY = bannerY + 46;
  const plotBotY = CANVAS_PRESETS.full.height - 10;

  const barW = Math.min(30, Math.max(16, scale.scaleX * 0.42));
  const hasTruncated = terms.some(
    (t) => mathToDesign(t.n, t.cn, scale).y < plotTopY + 18,
  );

  return (
    <g className="sequence-scene-grouped">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 图例提示栏 */}
      <g className="grouped-legend">
        <rect
          x={DESIGN_CENTER_X - 160}
          y={bannerY}
          width={320}
          height={26}
          rx={13}
          fill={withAlpha(MATH_COLORS.white, 0.95)}
          stroke={withAlpha(MATH_COLORS.sequenceHighlight, 0.5)}
          strokeWidth={1.2}
        />
        <rect
          x={DESIGN_CENTER_X - 140}
          y={bannerY + 7}
          width={12}
          height={12}
          rx={2}
          fill={withAlpha(MATH_COLORS.sequence, 0.5)}
          stroke={MATH_COLORS.sequence}
        />
        <text
          x={DESIGN_CENTER_X - 122}
          y={bannerY + 17}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.sequence}
          fontWeight="bold"
        >
          等差分量 aₙ
        </text>
        <rect
          x={DESIGN_CENTER_X + 15}
          y={bannerY + 7}
          width={12}
          height={12}
          rx={2}
          fill={withAlpha(MATH_COLORS.sequenceSecondary, 0.6)}
          stroke={MATH_COLORS.sequenceSecondary}
        />
        <text
          x={DESIGN_CENTER_X + 33}
          y={bannerY + 17}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.sequenceSecondary}
          fontWeight="bold"
        >
          等比分量 bₙ
        </text>
      </g>

      {hasTruncated && (
        <AxisBreakBanner
          xStart={mathToDesign(0.4, 0, scale).x}
          xEnd={mathToDesign(terms.length + 0.6, 0, scale).x}
          y={plotTopY - 2}
          direction="top"
          label="超高叠柱带锯齿截断，阶梯高度保留相对增量"
          fontScale={fontScale}
        />
      )}

      {terms.map((t) => {
        const ptAn = mathToDesign(t.n, t.an, scale);
        const ptCn = mathToDesign(t.n, t.cn, scale);
        const ptZero = mathToDesign(t.n, 0, scale);

        const safeZeroY = Math.min(plotBotY, Math.max(plotTopY + 8, ptZero.y));
        const safeAnY = Math.min(plotBotY, Math.max(plotTopY + 22, ptAn.y));

        const hAn = Math.abs(safeAnY - safeZeroY);
        const isAnOverflow = ptAn.y < plotTopY + 22 || ptAn.y > plotBotY;

        return (
          <g key={`grp-${t.n}`}>
            {/* 蓝色底柱 (等差部分 a_n) */}
            {!isAnOverflow && (
              <rect
                x={ptAn.x - barW / 2}
                y={Math.min(safeAnY, safeZeroY)}
                width={barW}
                height={Math.max(2, hAn)}
                fill={withAlpha(MATH_COLORS.sequence, 0.35)}
                stroke={MATH_COLORS.sequence}
                strokeWidth={1.5}
                rx={2}
              />
            )}

            {/* 紫色总/等比叠加柱 (含锯齿断轴保护) */}
            <SequenceTruncatedBar
              x={ptCn.x - barW / 2}
              width={barW}
              zeroY={isAnOverflow ? safeZeroY : safeAnY}
              rawTopY={ptCn.y}
              plotTopY={plotTopY}
              plotBotY={plotBotY}
              absValue={Math.abs(t.cn)}
              capThreshold={100}
              color={MATH_COLORS.sequenceSecondary}
              fillAlpha={0.45}
              strokeWidth={1.5}
              rx={2}
            >
              {({ topY, truncated }) => (
                <text
                  x={ptCn.x}
                  y={Math.max(
                    plotTopY - 6,
                    Math.min(topY, safeAnY, safeZeroY) - 6,
                  )}
                  textAnchor="middle"
                  fontSize={fontScale(9.5)}
                  fill={MATH_COLORS.sequenceSum}
                  fontWeight="bold"
                >
                  {truncated ? "↑ " : ""}c{toSub(t.n)} = a{toSub(t.n)} + b
                  {toSub(t.n)} ({formatMathNumber(t.cn)})
                </text>
              )}
            </SequenceTruncatedBar>
          </g>
        );
      })}
    </g>
  );
}
