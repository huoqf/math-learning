/**
 * src/features/statPercentile/components/StatPercentileHistogramScene.tsx
 * 直方图与数字特征场景（studyMode === "histogram"）
 * 纯 SVG 渲染，零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type {
  HistogramBin,
  HistogramStatsResult,
  PercentileShadeBin,
} from "@/math/statPercentile";

interface StatPercentileHistogramSceneProps {
  percentileP: number;
  bins: HistogramBin[];
  stats: HistogramStatsResult;
  shadeBins: PercentileShadeBin[];
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

const toSub = (n: number | string) =>
  String(n)
    .split("")
    .map((c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)] ?? c)
    .join("");

export const StatPercentileHistogramScene: React.FC<
  StatPercentileHistogramSceneProps
> = ({
  percentileP,
  bins,
  stats,
  shadeBins,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
}) => {
  // 拖拽百分位数点处理：解算横轴 x 位置转换为百分位 p%
  const handlePercentileDrag = React.useCallback(
    (newMathPos: { x: number; y: number }) => {
      const targetX = Math.min(100, Math.max(50, newMathPos.x));
      let cum = 0;
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
        if (targetX <= bin.xMax || i === bins.length - 1) {
          const ratioInBin = Math.max(
            0,
            Math.min(1, (targetX - bin.xMin) / bin.width),
          );
          const pEst = Math.round((cum + ratioInBin * bin.frequency) * 100);
          onParamChange("percentileP", Math.max(5, Math.min(95, pEst)));
          break;
        }
        cum += bin.frequency;
      }
    },
    [bins, onParamChange],
  );

  // 坐标轴端点位置
  const xAxisStart = mathToDesign(46, 0, scale);
  const xAxisEnd = mathToDesign(105, 0, scale);
  const yAxisStart = mathToDesign(50, 0, scale);
  const yAxisEnd = mathToDesign(50, 0.051, scale);

  return (
    <>
      {/* ────────────────── 坐标系基底 ────────────────── */}
      <g key="coordinate-system-base">
        {/* Y 轴水平参考网格线与刻度 */}
        {[0.01, 0.02, 0.03, 0.04, 0.05].map((hVal) => {
          const pLeft = mathToDesign(50, hVal, scale);
          const pRight = mathToDesign(100, hVal, scale);
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
          y={yAxisEnd.y - 10}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          频率 / 组距 (h = f / d)
        </text>

        {/* 横轴刻度与数值 50, 60, 70, 80, 90, 100 */}
        {[50, 60, 70, 80, 90, 100].map((xTick) => {
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

      {/* ────────────────── 模式 1: 直方图与数字特征 ────────────────── */}
      <g key="mode-histogram">
        {/* 1. 渲染基础直方图矩形 */}
        {bins.map((bin, i) => {
          const pTL = mathToDesign(bin.xMin, bin.height, scale);
          const pBR = mathToDesign(bin.xMax, 0, scale);
          const widthPx = Math.abs(pBR.x - pTL.x);
          const heightPx = Math.abs(pBR.y - pTL.y);
          const isTargetBin = i === stats.percentileBinIndex;

          return (
            <g key={`histogram-bin-${i}`}>
              <rect
                x={pTL.x}
                y={pTL.y}
                width={widthPx}
                height={heightPx}
                fill={
                  isTargetBin
                    ? withAlpha(MATH_COLORS.function, 0.16)
                    : withAlpha(MATH_COLORS.function, 0.09)
                }
                stroke={MATH_COLORS.function}
                strokeWidth={1.5}
                rx={2}
              />
              {/* 矩形顶部清晰标明 组距高度 h 与 频率 f */}
              <text
                x={pTL.x + widthPx / 2}
                y={pTL.y - 6}
                textAnchor="middle"
                fill={
                  isTargetBin ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText
                }
                fontSize={fontScale(10)}
                fontWeight="bold"
              >
                h={bin.height.toFixed(3)} (f=
                {(bin.frequency * 100).toFixed(0)}
                %)
              </text>
            </g>
          );
        })}

        {/* 2. 直方图百分位数 P_p 面积遮罩阴影 (从 x=50 到 x=percentileVal) */}
        {shadeBins.map((sBin, i) => {
          if (sBin.fraction <= 0) return null;
          const pTL = mathToDesign(sBin.xMin, sBin.height, scale);
          const pBR = mathToDesign(sBin.xMax, 0, scale);
          const widthPx = Math.abs(pBR.x - pTL.x);
          const heightPx = Math.abs(pBR.y - pTL.y);

          return (
            <rect
              key={`shade-bin-${i}`}
              x={pTL.x}
              y={pTL.y}
              width={widthPx}
              height={heightPx}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.32)}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1}
              rx={1}
            />
          );
        })}

        {/* 3. 百分位 P_p 切线与 Badge 标注 */}
        {(() => {
          const pVal = stats.percentileVal;
          const ptBase = mathToDesign(pVal, 0, scale);
          const currentBinIndex = stats.percentileBinIndex;
          const binH = bins[currentBinIndex]?.height ?? 0.02;
          const ptTop = mathToDesign(pVal, binH, scale);

          return (
            <g key="percentile-indicator">
              <line
                x1={ptBase.x}
                y1={ptTop.y - 20}
                x2={ptBase.x}
                y2={ptBase.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
                strokeDasharray="4 2"
              />
              <rect
                x={ptBase.x - 44}
                y={ptTop.y - 42}
                width={88}
                height={22}
                rx={4}
                fill={MATH_COLORS.paramPrimary}
              />
              <text
                x={ptBase.x}
                y={ptTop.y - 27}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(10.5)}
                fontWeight="bold"
              >
                P{toSub(percentileP)} = {pVal.toFixed(1)}
              </text>
            </g>
          );
        })()}

        {/* 4. 数字特征线系统 (众数 Mo / 中位数 Me / 均值 x̄，带智能重合检测与垂直错落避让) */}
        {(() => {
          const isCoincident =
            Math.abs(stats.mode - stats.mean) < 0.25 &&
            Math.abs(stats.median - stats.mean) < 0.25;

          if (isCoincident) {
            // 对称分布完全重合时：合并展示单一综合卡片，彻底避免 3 张标签卡在同一点重叠
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
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
                <rect
                  x={ptShared.x - 90}
                  y={yTopPx - 22}
                  width={180}
                  height={22}
                  rx={4}
                  fill={withAlpha(MATH_COLORS.function, 0.95)}
                />
                <text
                  x={ptShared.x}
                  y={yTopPx - 7}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(9.5)}
                  fontWeight="bold"
                >
                  均值 x̄ = 中位 Me = 众数 = {stats.mean.toFixed(1)}
                </text>

                {/* 物理力矩平衡三角形支点 (Fulcrum Pivot) */}
                <polygon
                  points={`${ptShared.x},${ptShared.y} ${ptShared.x - 6},${ptShared.y + 10} ${ptShared.x + 6},${ptShared.y + 10}`}
                  fill={MATH_COLORS.function}
                />
                <text
                  x={ptShared.x}
                  y={ptShared.y + 24}
                  textAnchor="middle"
                  fill={MATH_COLORS.function}
                  fontSize={fontScale(8.5)}
                  fontWeight="bold"
                >
                  ▲ 重心支点
                </text>
              </g>
            );
          }

          // 非完全重合时：按高低分层渲染
          const ptMode = mathToDesign(stats.mode, 0, scale);
          const yModeTopPx = mathToDesign(stats.mode, 0.038, scale).y;

          const ptMed = mathToDesign(stats.median, 0, scale);
          const yMedTopPx = mathToDesign(stats.median, 0.044, scale).y;

          const ptMean = mathToDesign(stats.mean, 0, scale);
          const yMeanTopPx = mathToDesign(stats.mean, 0.051, scale).y;

          return (
            <g key="separated-indicators">
              {/* 众数 Mo (绿色) */}
              <line
                x1={ptMode.x}
                y1={yModeTopPx}
                x2={ptMode.x}
                y2={ptMode.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
              <rect
                x={ptMode.x - 28}
                y={yModeTopPx - 18}
                width={56}
                height={16}
                rx={3}
                fill={withAlpha(MATH_COLORS.paramTertiary, 0.9)}
              />
              <text
                x={ptMode.x}
                y={yModeTopPx - 6}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                众数={stats.mode.toFixed(1)}
              </text>

              {/* 中位数 Me (橙色，仅当与百分位不重合时展示) */}
              {Math.abs(stats.median - stats.percentileVal) > 0.3 && (
                <>
                  <line
                    x1={ptMed.x}
                    y1={yMedTopPx}
                    x2={ptMed.x}
                    y2={ptMed.y}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={ptMed.x - 30}
                    y={yMedTopPx - 18}
                    width={60}
                    height={16}
                    rx={3}
                    fill={withAlpha(MATH_COLORS.paramSecondary, 0.9)}
                  />
                  <text
                    x={ptMed.x}
                    y={yMedTopPx - 6}
                    textAnchor="middle"
                    fill={MATH_COLORS.white}
                    fontSize={fontScale(9)}
                    fontWeight="bold"
                  >
                    中位={stats.median.toFixed(1)}
                  </text>
                </>
              )}

              {/* 平均数 x̄ (蓝色) */}
              <line
                x1={ptMean.x}
                y1={yMeanTopPx}
                x2={ptMean.x}
                y2={ptMean.y}
                stroke={MATH_COLORS.function}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <rect
                x={ptMean.x - 34}
                y={yMeanTopPx - 18}
                width={68}
                height={16}
                rx={3}
                fill={withAlpha(MATH_COLORS.function, 0.9)}
              />
              <text
                x={ptMean.x}
                y={yMeanTopPx - 6}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                均值={stats.mean.toFixed(1)}
              </text>

              {/* 物理力矩平衡三角形支点 (Fulcrum Pivot) */}
              <polygon
                points={`${ptMean.x},${ptMean.y} ${ptMean.x - 6},${ptMean.y + 10} ${ptMean.x + 6},${ptMean.y + 10}`}
                fill={MATH_COLORS.function}
              />
              <text
                x={ptMean.x}
                y={ptMean.y + 24}
                textAnchor="middle"
                fill={MATH_COLORS.function}
                fontSize={fontScale(8.5)}
                fontWeight="bold"
              >
                ▲ 重心支点
              </text>
            </g>
          );
        })()}

        {/* 7. 直方图下方：水平四分位数箱线图 (Boxplot) 对照 */}
        {(() => {
          const pQ1 = mathToDesign(stats.q1, -0.004, scale);
          const pMed = mathToDesign(stats.median, -0.004, scale);
          const pQ3 = mathToDesign(stats.q3, -0.004, scale);
          const pMin = mathToDesign(50, -0.004, scale);
          const pMax = mathToDesign(100, -0.004, scale);
          const boxHeight = 12;

          return (
            <g key="boxplot-comparison">
              {/* 须线 (Whiskers) */}
              <line
                x1={pMin.x}
                y1={pMin.y}
                x2={pQ1.x}
                y2={pQ1.y}
                stroke={MATH_COLORS.axis}
                strokeWidth={1.5}
              />
              <line
                x1={pQ3.x}
                y1={pQ3.y}
                x2={pMax.x}
                y2={pMax.y}
                stroke={MATH_COLORS.axis}
                strokeWidth={1.5}
              />
              <line
                x1={pMin.x}
                y1={pMin.y - 4}
                x2={pMin.x}
                y2={pMin.y + 4}
                stroke={MATH_COLORS.axis}
                strokeWidth={1.5}
              />
              <line
                x1={pMax.x}
                y1={pMax.y - 4}
                x2={pMax.x}
                y2={pMax.y + 4}
                stroke={MATH_COLORS.axis}
                strokeWidth={1.5}
              />

              {/* IQR 箱体 (Q1 到 Q3) */}
              <rect
                x={pQ1.x}
                y={pQ1.y - boxHeight / 2}
                width={Math.abs(pQ3.x - pQ1.x)}
                height={boxHeight}
                fill={withAlpha(MATH_COLORS.paramSecondary, 0.2)}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.5}
                rx={2}
              />

              {/* 中位数内线 */}
              <line
                x1={pMed.x}
                y1={pMed.y - boxHeight / 2}
                x2={pMed.x}
                y2={pMed.y + boxHeight / 2}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={2}
              />

              {/* 箱线图文字标识 */}
              <text
                x={pMin.x - 8}
                y={pMin.y + 3}
                textAnchor="end"
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                四分位箱线图:
              </text>
              <text
                x={pQ1.x}
                y={pQ1.y + 16}
                textAnchor="middle"
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(8.5)}
              >
                Q₁={stats.q1.toFixed(1)}
              </text>
              <text
                x={pQ3.x}
                y={pQ3.y + 16}
                textAnchor="middle"
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(8.5)}
              >
                Q₃={stats.q3.toFixed(1)}
              </text>
              <text
                x={(pQ1.x + pQ3.x) / 2}
                y={pQ1.y - 8}
                textAnchor="middle"
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(8.5)}
                fontWeight="bold"
              >
                IQR={stats.iqr.toFixed(1)} (中间50%)
              </text>
            </g>
          );
        })()}

        {/* 8. 可拖拽控制点：在横轴上拖动改变百分位数 */}
        <InteractivePoint
          cx={stats.percentileVal}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handlePercentileDrag}
          color={MATH_COLORS.paramPrimary}
          r={7}
          fontScale={fontScale}
        />
      </g>
    </>
  );
};
