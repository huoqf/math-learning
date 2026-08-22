/**
 * src/features/statPercentile/components/StatPercentileCumulativeScene.tsx
 * 百分位数线性插值与累积频率场景（studyMode === "cumulative"）
 * 纯 SVG 渲染，零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
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
  const yAxisEnd = mathToDesign(50, 1.08, scale);

  return (
    <>
      {/* ────────────────── 坐标系基底 ────────────────── */}
      <g key="coordinate-system-base">
        {/* Y 轴水平参考网格线与刻度 */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((cumRatio) => {
          const pLeft = mathToDesign(50, cumRatio, scale);
          const pRight = mathToDesign(100, cumRatio, scale);
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
          y={yAxisEnd.y - 10}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          累积频率 F(x)
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

      {/* ────────────────── 模式 2: 百分位数线性插值与累积频率 ────────────────── */}
      <g key="mode-cumulative">
        {/* 背景直方图轻量轮廓 */}
        {bins.map((bin, i) => {
          const pTL = mathToDesign(bin.xMin, bin.cumFrequency, scale);
          const pBR = mathToDesign(bin.xMax, 0, scale);
          return (
            <rect
              key={`cum-bg-${i}`}
              x={pTL.x}
              y={pTL.y}
              width={Math.abs(pBR.x - pTL.x)}
              height={Math.abs(pBR.y - pTL.y)}
              fill={withAlpha(MATH_COLORS.function, 0.04)}
              stroke={withAlpha(MATH_COLORS.function, 0.15)}
              strokeDasharray="2 2"
            />
          );
        })}

        {/* 累积频率 S 型折线 */}
        {(() => {
          const points = [{ x: 50, y: 0 }];
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
              {/* 折线各点圆点标注 */}
              {points.map((p, idx) => {
                const pt = mathToDesign(p.x, p.y, scale);
                return (
                  <g key={`cum-node-${idx}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      fill={MATH_COLORS.white}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={2}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
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

        {/* 目标百分位 p% 水平虚线与垂直向下线性插值线 */}
        {(() => {
          const ratio = percentileP / 100;
          const pVal = stats.percentileVal;
          const ptIntersect = mathToDesign(pVal, ratio, scale);
          const ptY = mathToDesign(50, ratio, scale);
          const ptX = mathToDesign(pVal, 0, scale);

          return (
            <g key="percentile-interpolation-projection">
              {/* 水平投影虚线 */}
              <line
                x1={ptY.x}
                y1={ptY.y}
                x2={ptIntersect.x}
                y2={ptIntersect.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              {/* 垂直投影虚线 */}
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
                x={ptY.x - 48}
                y={ptY.y - 10}
                width={42}
                height={20}
                rx={3}
                fill={MATH_COLORS.paramPrimary}
              />
              <text
                x={ptY.x - 27}
                y={ptY.y + 4}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(10)}
                fontWeight="bold"
              >
                {percentileP}%
              </text>

              {/* 横轴插值数值 Badge */}
              <rect
                x={ptX.x - 34}
                y={ptX.y + 6}
                width={68}
                height={22}
                rx={4}
                fill={MATH_COLORS.paramPrimary}
              />
              <text
                x={ptX.x}
                y={ptX.y + 21}
                textAnchor="middle"
                fill={MATH_COLORS.white}
                fontSize={fontScale(10.5)}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pVal.toFixed(2)}
              </text>
            </g>
          );
        })()}

        {/* 交互拖拽交点 */}
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
    </>
  );
};
