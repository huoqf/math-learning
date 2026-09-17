/**
 * src/features/statPercentile/components/StatPercentileHistogramScene.tsx
 * 直方图与数字特征场景（众数、中位数、均值与物理力矩重心）
 * 纯 SVG 渲染，零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import type { HistogramBin, HistogramStatsResult } from "@/math/statPercentile";

interface StatPercentileHistogramSceneProps {
  bins: HistogramBin[];
  stats: HistogramStatsResult;
  scale: SceneScale;
  vp?: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export const StatPercentileHistogramScene: React.FC<
  StatPercentileHistogramSceneProps
> = ({ bins, stats, scale, vp, onParamChange, fontScale = (v) => v }) => {
  const minX = bins[0]?.xMin ?? 40;
  const maxX = bins[bins.length - 1]?.xMax ?? 100;

  // 坐标轴端点位置（自适应 5 组、6 组、8 组范围）
  const xAxisStart = mathToDesign(minX - 4, 0, scale);
  const xAxisEnd = mathToDesign(maxX + 6, 0, scale);
  const yAxisStart = mathToDesign(minX, 0, scale);
  const yAxisEnd = mathToDesign(minX, 0.052, scale);

  // 动态收集全部组界刻度（如 6 组时为 40, 50, 60, 70, 80, 90, 100）
  const xTicks = [bins[0]?.xMin ?? minX, ...bins.map((b) => b.xMax)];

  // 中位数分割的横坐标
  const medianX = stats.median;

  return (
    <g key="stat-percentile-histogram-scene">
      {/* ────────────────── 1. 坐标系基底 ────────────────── */}
      <g key="coordinate-system-base">
        {/* Y 轴水平参考网格线与刻度 */}
        {[0.01, 0.02, 0.03, 0.04, 0.05].map((hVal) => {
          const pLeft = mathToDesign(minX, hVal, scale);
          const pRight = mathToDesign(maxX, hVal, scale);
          return (
            <g key={`y-grid-hist-${hVal}`}>
              <line
                x1={pLeft.x}
                y1={pLeft.y}
                x2={pRight.x}
                y2={pRight.y}
                stroke={withAlpha(MATH_COLORS.axis, 0.12)}
                strokeDasharray="3 3"
              />
              <line
                x1={pLeft.x - 5}
                y1={pLeft.y}
                x2={pLeft.x}
                y2={pLeft.y}
                stroke={MATH_COLORS.axis}
                strokeWidth={1.5}
              />
              <text
                x={pLeft.x - 8}
                y={pLeft.y + 4}
                textAnchor="end"
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(10)}
                fontFamily="monospace"
              >
                {hVal.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X/Y 主轴线 */}
        <line
          x1={xAxisStart.x}
          y1={xAxisStart.y}
          x2={xAxisEnd.x}
          y2={xAxisEnd.y}
          stroke={MATH_COLORS.axis}
          strokeWidth={2}
        />
        <line
          x1={yAxisStart.x}
          y1={yAxisStart.y}
          x2={yAxisEnd.x}
          y2={yAxisEnd.y}
          stroke={MATH_COLORS.axis}
          strokeWidth={2}
        />

        {/* 轴箭头 */}
        <polygon
          points={`${xAxisEnd.x},${xAxisEnd.y} ${xAxisEnd.x - 8},${xAxisEnd.y - 4} ${xAxisEnd.x - 8},${xAxisEnd.y + 4}`}
          fill={MATH_COLORS.axis}
        />
        <polygon
          points={`${yAxisEnd.x},${yAxisEnd.y} ${yAxisEnd.x - 4},${yAxisEnd.y + 8} ${yAxisEnd.x + 4},${yAxisEnd.y + 8}`}
          fill={MATH_COLORS.axis}
        />

        {/* 轴名称标注 */}
        <text
          x={xAxisEnd.x - 5}
          y={xAxisEnd.y + 22}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          样本数值 x
        </text>
        <text
          x={yAxisEnd.x - 15}
          y={yAxisEnd.y - 12}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          频率 / 组距 (h = f / d)
        </text>

        {/* 横轴刻度与数值自适应渲染 */}
        {xTicks.map((xTick) => {
          const pt = mathToDesign(xTick, 0, scale);
          return (
            <g key={`x-tick-${xTick}`}>
              <line
                x1={pt.x}
                y1={pt.y}
                x2={pt.x}
                y2={pt.y + 5}
                stroke={MATH_COLORS.axis}
                strokeWidth={1.5}
              />
              <text
                x={pt.x}
                y={pt.y + 18}
                textAnchor="middle"
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(11)}
                fontWeight="600"
                fontFamily="monospace"
              >
                {xTick}
              </text>
            </g>
          );
        })}
      </g>

      {/* ────────────────── 2. 直方图各组矩形 ────────────────── */}
      <g key="histogram-rectangles">
        {bins.map((bin, i) => {
          const pTL = mathToDesign(bin.xMin, bin.height, scale);
          const pBR = mathToDesign(bin.xMax, 0, scale);
          const widthPx = Math.abs(pBR.x - pTL.x);
          const heightPx = Math.abs(pBR.y - pTL.y);
          const isHighest = Math.abs(bin.midpoint - stats.mode) < 0.1;

          return (
            <g key={`histogram-bin-${i}`}>
              {/* 基础矩形主体 */}
              <rect
                x={pTL.x}
                y={pTL.y}
                width={widthPx}
                height={heightPx}
                fill={
                  isHighest
                    ? withAlpha(MATH_COLORS.function, 0.18)
                    : withAlpha(MATH_COLORS.function, 0.08)
                }
                stroke={MATH_COLORS.function}
                strokeWidth={1.5}
                rx={2}
              />

              {/* 矩形中心细虚线与组中值点 */}
              {(() => {
                const ptMidTop = mathToDesign(bin.midpoint, bin.height, scale);
                const ptMidBot = mathToDesign(bin.midpoint, 0, scale);
                return (
                  <line
                    x1={ptMidTop.x}
                    y1={ptMidTop.y}
                    x2={ptMidBot.x}
                    y2={ptMidBot.y}
                    stroke={withAlpha(MATH_COLORS.function, 0.25)}
                    strokeDasharray="2 2"
                  />
                );
              })()}

              {/* 矩形顶部清晰标明：高度 h 与 组频率 f */}
              <text
                x={pTL.x + widthPx / 2}
                y={pTL.y - 6}
                textAnchor="middle"
                fill={
                  isHighest ? MATH_COLORS.paramTertiary : MATH_COLORS.labelText
                }
                fontSize={fontScale(10)}
                fontWeight={isHighest ? "bold" : "600"}
              >
                h={bin.height.toFixed(3)} (f={(bin.frequency * 100).toFixed(0)}
                %)
              </text>
            </g>
          );
        })}
      </g>

      {/* ────────────────── 3. 中位数平分面积半透明指示 ────────────────── */}
      {(() => {
        // 标注两边各 50% 的文字指示
        const ptLeftTag = mathToDesign((minX + medianX) / 2, 0.008, scale);
        const ptRightTag = mathToDesign((medianX + maxX) / 2, 0.008, scale);

        return (
          <g key="median-area-indicators" opacity={0.85}>
            <rect
              x={ptLeftTag.x - 36}
              y={ptLeftTag.y - 10}
              width={72}
              height={18}
              rx={3}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.12)}
              stroke={withAlpha(MATH_COLORS.paramSecondary, 0.35)}
            />
            <text
              x={ptLeftTag.x}
              y={ptLeftTag.y + 3}
              textAnchor="middle"
              fill={MATH_COLORS.paramSecondary}
              fontSize={fontScale(9)}
              fontWeight="bold"
            >
              左侧面积 50%
            </text>

            <rect
              x={ptRightTag.x - 36}
              y={ptRightTag.y - 10}
              width={72}
              height={18}
              rx={3}
              fill={withAlpha(MATH_COLORS.function, 0.1)}
              stroke={withAlpha(MATH_COLORS.function, 0.3)}
            />
            <text
              x={ptRightTag.x}
              y={ptRightTag.y + 3}
              textAnchor="middle"
              fill={MATH_COLORS.function}
              fontSize={fontScale(9)}
              fontWeight="bold"
            >
              右侧面积 50%
            </text>
          </g>
        );
      })()}

      {/* ────────────────── 4. 三大特征量线系统 (众数/中位数/平均数) ────────────────── */}
      {(() => {
        const isCoincident =
          Math.abs(stats.mode - stats.mean) < 0.35 &&
          Math.abs(stats.median - stats.mean) < 0.35;

        if (isCoincident) {
          // 对称钟形分布完全重合时：合并为一个美观的学术联合卡片，彻底避免 3 张标签卡打架遮挡
          const ptShared = mathToDesign(stats.mean, 0, scale);
          const yTopPx = mathToDesign(stats.mean, 0.05, scale).y;

          return (
            <g key="coincident-indicators">
              <line
                x1={ptShared.x}
                y1={yTopPx}
                x2={ptShared.x}
                y2={ptShared.y}
                stroke={MATH_COLORS.function}
                strokeWidth={2.5}
                strokeDasharray="5 3"
              />
              <rect
                x={ptShared.x - 100}
                y={yTopPx - 24}
                width={200}
                height={24}
                rx={6}
                fill={MATH_COLORS.function}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              <text
                x={ptShared.x}
                y={yTopPx - 8}
                textAnchor="middle"
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(10)}
                fontWeight="bold"
              >
                众数 Mo = 中位 Me = 均值 x̄ = {stats.mean.toFixed(1)}
              </text>

              {/* 物理力矩平衡三角形支点 (Fulcrum Pivot) */}
              <polygon
                points={`${ptShared.x},${ptShared.y} ${ptShared.x - 8},${ptShared.y + 12} ${ptShared.x + 8},${ptShared.y + 12}`}
                fill={MATH_COLORS.function}
              />
              <rect
                x={ptShared.x - 65}
                y={ptShared.y + 16}
                width={130}
                height={18}
                rx={4}
                fill={withAlpha(MATH_COLORS.function, 0.12)}
                stroke={MATH_COLORS.function}
              />
              <text
                x={ptShared.x}
                y={ptShared.y + 29}
                textAnchor="middle"
                fill={MATH_COLORS.function}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                ▲ 重心支点 (力矩平衡)
              </text>
            </g>
          );
        }

        // 非对称分布时：按高低梯次分层渲染，互不遮挡
        const ptMode = mathToDesign(stats.mode, 0, scale);
        const yModeTopPx = mathToDesign(stats.mode, 0.044, scale).y;

        const ptMed = mathToDesign(stats.median, 0, scale);
        const yMedTopPx = mathToDesign(stats.median, 0.048, scale).y;

        const ptMean = mathToDesign(stats.mean, 0, scale);
        const yMeanTopPx = mathToDesign(stats.mean, 0.052, scale).y;

        return (
          <g key="separated-indicators">
            {/* 1. 众数 Mo (绿色虚线 + 倒三角标注) */}
            <line
              x1={ptMode.x}
              y1={yModeTopPx}
              x2={ptMode.x}
              y2={ptMode.y}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            <polygon
              points={`${ptMode.x},${yModeTopPx + 14} ${ptMode.x - 5},${yModeTopPx + 5} ${ptMode.x + 5},${yModeTopPx + 5}`}
              fill={MATH_COLORS.paramTertiary}
            />
            <rect
              x={ptMode.x - 36}
              y={yModeTopPx - 16}
              width={72}
              height={18}
              rx={4}
              fill={MATH_COLORS.paramTertiary}
            />
            <text
              x={ptMode.x}
              y={yModeTopPx - 3}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(9.5)}
              fontWeight="bold"
            >
              众数={stats.mode.toFixed(1)}
            </text>

            {/* 2. 中位数 Me (橙色虚线，面积二等分线) */}
            <line
              x1={ptMed.x}
              y1={yMedTopPx}
              x2={ptMed.x}
              y2={ptMed.y}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            <rect
              x={ptMed.x - 36}
              y={yMedTopPx - 16}
              width={72}
              height={18}
              rx={4}
              fill={MATH_COLORS.paramSecondary}
            />
            <text
              x={ptMed.x}
              y={yMedTopPx - 3}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(9.5)}
              fontWeight="bold"
            >
              中位={stats.median.toFixed(1)}
            </text>

            {/* 3. 平均数 x̄ (蓝色虚线 + 重心天平支点) */}
            <line
              x1={ptMean.x}
              y1={yMeanTopPx}
              x2={ptMean.x}
              y2={ptMean.y}
              stroke={MATH_COLORS.function}
              strokeWidth={2.5}
              strokeDasharray="5 3"
            />
            <rect
              x={ptMean.x - 36}
              y={yMeanTopPx - 16}
              width={72}
              height={18}
              rx={4}
              fill={MATH_COLORS.function}
            />
            <text
              x={ptMean.x}
              y={yMeanTopPx - 3}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(9.5)}
              fontWeight="bold"
            >
              均值={stats.mean.toFixed(1)}
            </text>

            {/* 物理力矩平衡三角形支点 (Fulcrum Pivot) */}
            <polygon
              points={`${ptMean.x},${ptMean.y} ${ptMean.x - 8},${ptMean.y + 12} ${ptMean.x + 8},${ptMean.y + 12}`}
              fill={MATH_COLORS.function}
            />
            <rect
              x={ptMean.x - 55}
              y={ptMean.y + 16}
              width={110}
              height={18}
              rx={4}
              fill={withAlpha(MATH_COLORS.function, 0.12)}
              stroke={MATH_COLORS.function}
            />
            <text
              x={ptMean.x}
              y={ptMean.y + 29}
              textAnchor="middle"
              fill={MATH_COLORS.function}
              fontSize={fontScale(9)}
              fontWeight="bold"
            >
              ▲ 重心 (可拖拽平衡)
            </text>
          </g>
        );
      })()}

      {/* ────────────────── 5. 重心物理支点拖拽交互点 ────────────────── */}
      {vp && onParamChange && (
        <InteractivePoint
          cx={stats.mean}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={(newPos) => {
            const midCenter = (minX + maxX) / 2;
            const offset = newPos.x - midCenter;
            const targetShift = Math.max(-1, Math.min(1, offset / 12));
            onParamChange("shift", Number(targetShift.toFixed(2)));
          }}
          color={MATH_COLORS.function}
          r={7}
          fontScale={fontScale}
        />
      )}
    </g>
  );
};
