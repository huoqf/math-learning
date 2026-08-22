import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels } from "@/utils/labelAvoider";
import type { PlacedLabel } from "@/utils/labelAvoider";
import type { HistogramBin, HistogramStats } from "@/math/probabilityNormal";

export interface TooltipBinData {
  xStart: number;
  xEnd: number;
  mid: number;
  width: number;
  density: number;
  frequency: number;
  count: number;
}

interface ProbabilityNormalHistogramSceneProps {
  bins: HistogramBin[];
  stats: HistogramStats;
  getHistDensityAt: (x: number) => number;
  percentileP: number;
  showStatsLines: boolean;
  showFrequencyLine: boolean;
  scale: SceneScale;
  fontScale: (size: number) => number;
  onBinMouseEnter?: (bin: TooltipBinData, e: React.MouseEvent) => void;
  onBinMouseMove?: (e: React.MouseEvent) => void;
  onBinMouseLeave?: () => void;
}

export function ProbabilityNormalHistogramScene({
  bins,
  stats,
  getHistDensityAt,
  percentileP,
  showStatsLines,
  showFrequencyLine,
  scale,
  fontScale,
  onBinMouseEnter,
  onBinMouseMove,
  onBinMouseLeave,
}: ProbabilityNormalHistogramSceneProps) {
  // 特征数标示线与优化避让标签
  const labelEntries = useMemo(() => {
    if (!showStatsLines) return [];

    // 精确使用柱顶高度，确保标签自然悬浮在柱顶上方
    const modeY = getHistDensityAt(stats.mode);
    const medianY = getHistDensityAt(stats.median);
    const meanY = getHistDensityAt(stats.mean);
    const pY = getHistDensityAt(stats.percentilePValue);

    const modePt = mathToDesign(stats.mode, modeY, scale);
    const medianPt = mathToDesign(stats.median, medianY, scale);
    const meanPt = mathToDesign(stats.mean, meanY, scale);
    const pPt = mathToDesign(stats.percentilePValue, pY, scale);

    return [
      {
        key: "mode",
        text: `众数 ${stats.mode.toFixed(2)}`,
        x: modePt.x,
        y: modePt.y,
        anchor: "middle" as const,
        dy: -10,
        priority: 4,
      },
      {
        key: "median",
        text: `中位数 ${stats.median.toFixed(2)}`,
        x: medianPt.x,
        y: medianPt.y,
        anchor: "middle" as const,
        dy: -10,
        priority: 3,
      },
      {
        key: "mean",
        text: `均值 ${stats.mean.toFixed(2)}`,
        x: meanPt.x,
        y: meanPt.y,
        anchor: "middle" as const,
        dy: -10,
        priority: 2,
      },
      {
        key: "percentile",
        text: `P${percentileP} = ${stats.percentilePValue.toFixed(2)}`,
        x: pPt.x,
        y: pPt.y,
        anchor: "middle" as const,
        dy: -10,
        priority: 1,
      },
    ];
  }, [stats, scale, showStatsLines, percentileP, getHistDensityAt]);

  const placedLabels: PlacedLabel[] = useMemo(() => {
    return avoidLabels(labelEntries, { fontScale, stepY: 14 });
  }, [labelEntries, fontScale]);

  return (
    <g>
      {/* 直方图各条柱 */}
      {bins.map((bin) => {
        const leftTop = mathToDesign(bin.xStart, bin.density, scale);
        const rightBottom = mathToDesign(bin.xEnd, 0, scale);
        const rectWidth = Math.max(1, rightBottom.x - leftTop.x);
        const rectHeight = Math.max(1, rightBottom.y - leftTop.y);

        // 如果该矩形位于中位数或指定百分位数左侧，使用更具视觉提示的浅色带
        const isLeftOfPercentile = bin.xEnd <= stats.percentilePValue;

        return (
          <g key={bin.index}>
            <rect
              x={leftTop.x}
              y={leftTop.y}
              width={rectWidth}
              height={rectHeight}
              fill={
                isLeftOfPercentile
                  ? withAlpha(MATH_COLORS.paramTertiary, 0.4)
                  : withAlpha(MATH_COLORS.barFill, 0.45)
              }
              stroke={
                isLeftOfPercentile
                  ? MATH_COLORS.paramTertiary
                  : MATH_COLORS.barBorder
              }
              strokeWidth={1.5}
              className="transition-colors duration-150 hover:opacity-80"
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => onBinMouseEnter?.(bin, e)}
              onMouseMove={onBinMouseMove}
              onMouseLeave={onBinMouseLeave}
            />
          </g>
        );
      })}

      {/* 频率折线图 */}
      {showFrequencyLine && (
        <g>
          {(() => {
            const points: string[] = [];
            const startPt = mathToDesign(bins[0].xStart, 0, scale);
            points.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);
            for (const bin of bins) {
              const pt = mathToDesign(bin.mid, bin.density, scale);
              points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
            }
            const endPt = mathToDesign(bins[bins.length - 1].xEnd, 0, scale);
            points.push(`L ${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}`);

            return (
              <path
                d={points.join(" ")}
                fill="none"
                stroke={MATH_COLORS.frequencyLine}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })()}
        </g>
      )}

      {/* 特征数参考虚线与防重叠标签 */}
      {showStatsLines && (
        <g>
          {/* 众数线 (红色) */}
          {(() => {
            const modeY = getHistDensityAt(stats.mode);
            const p1 = mathToDesign(stats.mode, 0, scale);
            const p2 = mathToDesign(stats.mode, modeY, scale);
            return (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })()}

          {/* 中位数线 (橙色 - 平分面积) */}
          {(() => {
            const medY = getHistDensityAt(stats.median);
            const p1 = mathToDesign(stats.median, 0, scale);
            const p2 = mathToDesign(stats.median, medY, scale);
            return (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={2}
                strokeDasharray="5 3"
              />
            );
          })()}

          {/* 平均数线 (蓝色 - 重心) */}
          {(() => {
            const meanY = getHistDensityAt(stats.mean);
            const p1 = mathToDesign(stats.mean, 0, scale);
            const p2 = mathToDesign(stats.mean, meanY, scale);
            return (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={MATH_COLORS.function}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })()}

          {/* 目标百分位数线 (翠绿色) */}
          {percentileP !== 50 &&
            (() => {
              const pY = getHistDensityAt(stats.percentilePValue);
              const p1 = mathToDesign(stats.percentilePValue, 0, scale);
              const p2 = mathToDesign(stats.percentilePValue, pY, scale);
              return (
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              );
            })()}

          {/* 避让标签渲染 */}
          {placedLabels.map((lbl) => {
            let color: string = MATH_COLORS.function;
            if (lbl.key === "mode") color = MATH_COLORS.paramPrimary;
            if (lbl.key === "median") color = MATH_COLORS.paramSecondary;
            if (lbl.key === "percentile") color = MATH_COLORS.paramTertiary;

            return (
              <text
                key={lbl.key}
                x={lbl.x}
                y={lbl.y}
                dy={lbl.finalDy}
                fontSize={fontScale(11)}
                fill={color}
                textAnchor={lbl.anchor}
                className="font-bold select-none drop-shadow-sm"
              >
                {lbl.text}
              </text>
            );
          })}
        </g>
      )}
    </g>
  );
}
