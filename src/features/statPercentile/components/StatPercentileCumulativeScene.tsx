/**
 * src/features/statPercentile/components/StatPercentileCumulativeScene.tsx
 * 百分位数线性插值、累积频率折线与四分位箱线图场景
 * 纯 SVG 渲染，零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import type { HistogramBin, HistogramStatsResult } from "@/math/statPercentile";

interface StatPercentileCumulativeSceneProps {
  percentileP: number;
  bins: HistogramBin[];
  stats: HistogramStatsResult;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export const StatPercentileCumulativeScene: React.FC<
  StatPercentileCumulativeSceneProps
> = ({
  percentileP,
  bins,
  stats,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
}) => {
  const minX = bins[0]?.xMin ?? 40;
  const maxX = bins[bins.length - 1]?.xMax ?? 100;

  // 拖拽百分位数点处理：解算横轴 x 位置转换为百分位 p%
  const handlePercentileDrag = React.useCallback(
    (newMathPos: { x: number; y: number }) => {
      const targetX = Math.min(maxX, Math.max(minX, newMathPos.x));
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
    [bins, minX, maxX, onParamChange],
  );

  // 坐标轴端点位置
  const xAxisStart = mathToDesign(minX - 4, 0, scale);
  const xAxisEnd = mathToDesign(maxX + 6, 0, scale);
  const yAxisStart = mathToDesign(minX, 0, scale);
  const yAxisEnd = mathToDesign(minX, 1.08, scale);

  const pVal = stats.percentileVal;
  const ratio = percentileP / 100;

  // 动态收集全部组界刻度
  const xTicks = [bins[0]?.xMin ?? minX, ...bins.map((b) => b.xMax)];

  return (
    <g key="stat-percentile-cumulative-scene">
      {/* ────────────────── 1. 坐标系基底 ────────────────── */}
      <g key="coordinate-system-base">
        {/* Y 轴水平参考网格线与刻度 */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((cumRatio) => {
          const pLeft = mathToDesign(minX, cumRatio, scale);
          const pRight = mathToDesign(maxX, cumRatio, scale);
          return (
            <g key={`y-grid-cum-${cumRatio}`}>
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
                {Math.round(cumRatio * 100)}%
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
          累积频率 F(x)
        </text>

        {/* 横轴刻度与数值 */}
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

      {/* ────────────────── 2. 背景累积直方图轮廓与累积面积 ────────────────── */}
      <g key="cumulative-histogram-background">
        {bins.map((bin, i) => {
          const pTL = mathToDesign(bin.xMin, bin.cumFrequency, scale);
          const pBR = mathToDesign(bin.xMax, 0, scale);
          const widthPx = Math.abs(pBR.x - pTL.x);
          const heightPx = Math.abs(pBR.y - pTL.y);

          // 计算当前百分位数 pVal 在该 bin 内部的填充宽度
          let fillWidth = 0;
          if (pVal >= bin.xMax) {
            fillWidth = widthPx;
          } else if (pVal > bin.xMin) {
            fillWidth = ((pVal - bin.xMin) / bin.width) * widthPx;
          }

          return (
            <g key={`cum-hist-bin-${i}`}>
              {/* 背景矩形线框 */}
              <rect
                x={pTL.x}
                y={pTL.y}
                width={widthPx}
                height={heightPx}
                fill={withAlpha(MATH_COLORS.function, 0.04)}
                stroke={withAlpha(MATH_COLORS.function, 0.18)}
                strokeDasharray="2 2"
                rx={1}
              />

              {/* 已累积覆盖高亮面积 */}
              {fillWidth > 0 && (
                <rect
                  x={pTL.x}
                  y={pTL.y}
                  width={fillWidth}
                  height={heightPx}
                  fill={withAlpha(MATH_COLORS.paramPrimary, 0.16)}
                  stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* ────────────────── 3. 累积频率 S 型折线 (Ogive) ────────────────── */}
      {(() => {
        const points = [{ x: minX, y: 0 }];
        bins.forEach((b) => points.push({ x: b.xMax, y: b.cumFrequency }));
        const pathStr = points
          .map((p, idx) => {
            const pt = mathToDesign(p.x, p.y, scale);
            return `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
          })
          .join(" ");

        return (
          <g key="cumulative-polyline">
            <path
              d={pathStr}
              fill="none"
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={3}
            />
            {/* 折线关键节点 */}
            {points.map((p, idx) => {
              const pt = mathToDesign(p.x, p.y, scale);
              const isOrigin = idx === 0;

              return (
                <g key={`cum-node-${idx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill={CANVAS_COLORS.white}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={2}
                  />
                  <text
                    x={isOrigin ? pt.x + 6 : pt.x}
                    y={isOrigin ? pt.y - 6 : pt.y - 8}
                    textAnchor={isOrigin ? "start" : "middle"}
                    fill={MATH_COLORS.labelText}
                    fontSize={fontScale(9.5)}
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    ({p.x}, {Math.round(p.y * 100)}%)
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ────────────────── 4. 百分位目标投影与线性插值指示 ────────────────── */}
      {(() => {
        const ptIntersect = mathToDesign(pVal, ratio, scale);
        const ptY = mathToDesign(minX, ratio, scale);
        const ptX = mathToDesign(pVal, 0, scale);

        return (
          <g key="percentile-interpolation-projection">
            {/* 水平投影虚线 (从纵轴 p% 到折线交点) */}
            <line
              x1={ptY.x}
              y1={ptY.y}
              x2={ptIntersect.x}
              y2={ptIntersect.y}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            {/* 垂直投影虚线 (从交点垂直落到横轴) */}
            <line
              x1={ptIntersect.x}
              y1={ptIntersect.y}
              x2={ptX.x}
              y2={ptX.y}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={2}
              strokeDasharray="4 3"
            />

            {/* 纵轴百分比 Badge */}
            <rect
              x={ptY.x - 50}
              y={ptY.y - 11}
              width={44}
              height={22}
              rx={4}
              fill={MATH_COLORS.paramPrimary}
            />
            <text
              x={ptY.x - 28}
              y={ptY.y + 4}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              {percentileP}%
            </text>

            {/* 横轴插值结果数值 Badge */}
            <rect
              x={ptX.x - 42}
              y={ptX.y + 6}
              width={84}
              height={24}
              rx={5}
              fill={MATH_COLORS.paramPrimary}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))"
            />
            <text
              x={ptX.x}
              y={ptX.y + 22}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
              fontFamily="monospace"
            >
              P{percentileP} = {pVal.toFixed(2)}
            </text>
          </g>
        );
      })()}

      {/* ────────────────── 5. 下方四分位箱线图 (五数概括) ────────────────── */}
      {(() => {
        const pQ1 = mathToDesign(stats.q1, -0.065, scale);
        const pMed = mathToDesign(stats.median, -0.065, scale);
        const pQ3 = mathToDesign(stats.q3, -0.065, scale);
        const pMin = mathToDesign(minX, -0.065, scale);
        const pMax = mathToDesign(maxX, -0.065, scale);
        const boxHeight = 16;

        return (
          <g key="boxplot-five-number-summary">
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
            {/* 左右端点垂线 */}
            <line
              x1={pMin.x}
              y1={pMin.y - 6}
              x2={pMin.x}
              y2={pMin.y + 6}
              stroke={MATH_COLORS.axis}
              strokeWidth={1.5}
            />
            <line
              x1={pMax.x}
              y1={pMax.y - 6}
              x2={pMax.x}
              y2={pMax.y + 6}
              stroke={MATH_COLORS.axis}
              strokeWidth={1.5}
            />

            {/* IQR 箱体 (Q1 到 Q3) */}
            <rect
              x={pQ1.x}
              y={pQ1.y - boxHeight / 2}
              width={Math.abs(pQ3.x - pQ1.x)}
              height={boxHeight}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.25)}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1.8}
              rx={3}
            />

            {/* 中位数垂直内线 */}
            <line
              x1={pMed.x}
              y1={pMed.y - boxHeight / 2}
              x2={pMed.x}
              y2={pMed.y + boxHeight / 2}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={2.5}
            />

            {/* 箱线图标题与数值标注 */}
            <text
              x={pMin.x - 8}
              y={pMin.y + 4}
              textAnchor="end"
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              四分位箱线图:
            </text>
            <text
              x={pQ1.x}
              y={pQ1.y + 18}
              textAnchor="middle"
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(9)}
              fontWeight="600"
            >
              Q₁={stats.q1.toFixed(1)}
            </text>
            <text
              x={pMed.x}
              y={pMed.y - 12}
              textAnchor="middle"
              fill={MATH_COLORS.paramSecondary}
              fontSize={fontScale(9)}
              fontWeight="bold"
            >
              Me={stats.median.toFixed(1)}
            </text>
            <text
              x={pQ3.x}
              y={pQ3.y + 18}
              textAnchor="middle"
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(9)}
              fontWeight="600"
            >
              Q₃={stats.q3.toFixed(1)}
            </text>
            <text
              x={(pQ1.x + pQ3.x) / 2}
              y={pQ1.y + 4}
              textAnchor="middle"
              fill={MATH_COLORS.paramSecondary}
              fontSize={fontScale(9)}
              fontWeight="bold"
            >
              IQR={stats.iqr.toFixed(1)} (中间50%)
            </text>
          </g>
        );
      })()}

      {/* ────────────────── 6. 交互拖拽控制点 ────────────────── */}
      <InteractivePoint
        cx={stats.percentileVal}
        cy={percentileP / 100}
        scale={scale}
        vp={vp}
        onDrag={handlePercentileDrag}
        color={MATH_COLORS.paramPrimary}
        r={7}
        fontScale={fontScale}
      />
    </g>
  );
};
