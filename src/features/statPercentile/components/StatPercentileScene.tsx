/**
 * src/features/statPercentile/components/StatPercentileScene.tsx
 * 纯 SVG 渲染：直方图、百分位数与分层抽样
 * 零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  generateHistogramBins,
  calculateHistogramStats,
  calculateStratifiedSampling,
  calculatePercentileShadeBins,
} from "@/math/statPercentile";

interface StatPercentileSceneProps {
  params: {
    percentileP: number;
    shift: number;
    sampleN: number;
    N1: number;
    N2: number;
    N3: number;
    mean1: number;
    mean2: number;
    mean3: number;
    var1: number;
    var2: number;
    var3: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "histogram" | "cumulative" | "stratified";
}

const toSub = (n: number | string) =>
  String(n)
    .split("")
    .map((c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)] ?? c)
    .join("");

export const StatPercentileScene: React.FC<StatPercentileSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "histogram",
}) => {
  const {
    percentileP,
    shift,
    sampleN,
    N1,
    N2,
    N3,
    mean1,
    mean2,
    mean3,
    var1,
    var2,
    var3,
  } = params;

  const bins = React.useMemo(() => generateHistogramBins(shift), [shift]);
  const stats = React.useMemo(
    () => calculateHistogramStats(bins, percentileP),
    [bins, percentileP],
  );
  const shadeBins = React.useMemo(
    () => calculatePercentileShadeBins(bins, stats.percentileVal),
    [bins, stats.percentileVal],
  );

  const strat = React.useMemo(
    () =>
      calculateStratifiedSampling(
        sampleN,
        N1,
        N2,
        N3,
        mean1,
        mean2,
        mean3,
        var1,
        var2,
        var3,
      ),
    [sampleN, N1, N2, N3, mean1, mean2, mean3, var1, var2, var3],
  );

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
  const yAxisEnd = mathToDesign(
    50,
    studyMode === "cumulative" ? 1.08 : 0.051,
    scale,
  );

  return (
    <g>
      {/* ────────────────── 坐标系基底：仅在 histogram 与 cumulative 模式下 ────────────────── */}
      {studyMode !== "stratified" && (
        <g key="coordinate-system-base">
          {/* Y 轴水平参考网格线与刻度 */}
          {studyMode === "histogram" &&
            [0.01, 0.02, 0.03, 0.04, 0.05].map((hVal) => {
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

          {studyMode === "cumulative" &&
            [0.2, 0.4, 0.6, 0.8, 1.0].map((cumRatio) => {
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
            {studyMode === "cumulative"
              ? "累积频率 F(x)"
              : "频率 / 组距 (h = f / d)"}
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
      )}

      {/* ────────────────── 模式 1: 直方图与数字特征 ────────────────── */}
      {studyMode === "histogram" && (
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
                    isTargetBin
                      ? MATH_COLORS.paramPrimary
                      : MATH_COLORS.labelText
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

          {/* 4. 数字特征线：众数 Mo (绿色实线) */}
          {(() => {
            const ptMode = mathToDesign(stats.mode, 0, scale);
            const yTopPx = mathToDesign(stats.mode, 0.046, scale).y;

            return (
              <g key="mode-indicator">
                <line
                  x1={ptMode.x}
                  y1={yTopPx}
                  x2={ptMode.x}
                  y2={ptMode.y}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                />
                <rect
                  x={ptMode.x - 30}
                  y={yTopPx - 20}
                  width={60}
                  height={18}
                  rx={3}
                  fill={withAlpha(MATH_COLORS.paramTertiary, 0.9)}
                />
                <text
                  x={ptMode.x}
                  y={yTopPx - 7}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(9.5)}
                  fontWeight="bold"
                >
                  众数={stats.mode.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* 5. 数字特征线：估算中位数 Me (橙色虚线，仅当 p !== 50 时展现避免重叠) */}
          {percentileP !== 50 &&
            (() => {
              const ptMed = mathToDesign(stats.median, 0, scale);
              const yTopPx = mathToDesign(stats.median, 0.042, scale).y;

              return (
                <g key="median-indicator">
                  <line
                    x1={ptMed.x}
                    y1={yTopPx}
                    x2={ptMed.x}
                    y2={ptMed.y}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={ptMed.x - 32}
                    y={yTopPx - 18}
                    width={64}
                    height={16}
                    rx={3}
                    fill={withAlpha(MATH_COLORS.paramSecondary, 0.9)}
                  />
                  <text
                    x={ptMed.x}
                    y={yTopPx - 6}
                    textAnchor="middle"
                    fill={MATH_COLORS.white}
                    fontSize={fontScale(9)}
                    fontWeight="bold"
                  >
                    中位={stats.median.toFixed(1)}
                  </text>
                </g>
              );
            })()}

          {/* 6. 数字特征线：平均数 x̄ 与 物理力矩平衡支点 (蓝色) */}
          {(() => {
            const ptMean = mathToDesign(stats.mean, 0, scale);
            const yTopPx = mathToDesign(stats.mean, 0.05, scale).y;

            return (
              <g key="mean-indicator">
                <line
                  x1={ptMean.x}
                  y1={yTopPx}
                  x2={ptMean.x}
                  y2={ptMean.y}
                  stroke={MATH_COLORS.function}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <rect
                  x={ptMean.x - 36}
                  y={yTopPx - 20}
                  width={72}
                  height={18}
                  rx={3}
                  fill={withAlpha(MATH_COLORS.function, 0.9)}
                />
                <text
                  x={ptMean.x}
                  y={yTopPx - 7}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(9.5)}
                  fontWeight="bold"
                >
                  均值 x̄={stats.mean.toFixed(1)}
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
      )}

      {/* ────────────────── 模式 2: 百分位数线性插值与累积频率 ────────────────── */}
      {studyMode === "cumulative" && (
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
      )}

      {/* ────────────────── 模式 3: 分层抽样与总方差数形结合图形 ────────────────── */}
      {studyMode === "stratified" && (
        <g key="mode-stratified-vis">
          {/* 1. 统一样本数值 X 轴 (50 ~ 100) */}
          {(() => {
            const pStart = mathToDesign(46, 0.08, scale);
            const pEnd = mathToDesign(105, 0.08, scale);

            return (
              <g key="stratified-axis">
                <line
                  x1={pStart.x}
                  y1={pStart.y}
                  x2={pEnd.x}
                  y2={pEnd.y}
                  stroke={MATH_COLORS.axis}
                  strokeWidth={2}
                />
                <polygon
                  points={`${pEnd.x},${pEnd.y} ${pEnd.x - 8},${pEnd.y - 4} ${pEnd.x - 8},${pEnd.y + 4}`}
                  fill={MATH_COLORS.axis}
                />
                <text
                  x={pEnd.x - 5}
                  y={pEnd.y + 20}
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                >
                  样本数值 x
                </text>

                {[50, 60, 70, 80, 90, 100].map((xTick) => {
                  const pt = mathToDesign(xTick, 0.08, scale);
                  return (
                    <g key={`strat-tick-${xTick}`}>
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
            );
          })()}

          {/* 2. 总体均值贯穿参考线 (蓝色虚线) */}
          {(() => {
            const ptMeanTop = mathToDesign(strat.totalMean, 0.88, scale);
            const ptMeanBot = mathToDesign(strat.totalMean, 0.08, scale);

            return (
              <g key="total-mean-line">
                <line
                  x1={ptMeanTop.x}
                  y1={ptMeanTop.y}
                  x2={ptMeanBot.x}
                  y2={ptMeanBot.y}
                  stroke={MATH_COLORS.function}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
                <rect
                  x={ptMeanTop.x - 55}
                  y={ptMeanTop.y - 22}
                  width={110}
                  height={22}
                  rx={4}
                  fill={MATH_COLORS.function}
                />
                <text
                  x={ptMeanTop.x}
                  y={ptMeanTop.y - 7}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(10.5)}
                  fontWeight="bold"
                >
                  总体均值 x̄ = {strat.totalMean.toFixed(2)}
                </text>
              </g>
            );
          })()}

          {/* 3. 三层高斯密度分布带 */}
          {(() => {
            const strataInfo = [
              {
                name: "层 1 (组 A)",
                N: strat.strataN[0],
                n: strat.strataSampleN[0],
                weight: strat.strataWeights[0],
                mean: strat.strataMeans[0],
                var: strat.strataVars[0],
                yBase: 0.24,
                color: MATH_COLORS.paramPrimary,
              },
              {
                name: "层 2 (组 B)",
                N: strat.strataN[1],
                n: strat.strataSampleN[1],
                weight: strat.strataWeights[1],
                mean: strat.strataMeans[1],
                var: strat.strataVars[1],
                yBase: 0.44,
                color: MATH_COLORS.paramSecondary,
              },
              {
                name: "层 3 (组 C)",
                N: strat.strataN[2],
                n: strat.strataSampleN[2],
                weight: strat.strataWeights[2],
                mean: strat.strataMeans[2],
                var: strat.strataVars[2],
                yBase: 0.64,
                color: MATH_COLORS.paramTertiary,
              },
            ];

            return (
              <g key="strata-distribution-curves">
                {strataInfo.map((st, i) => {
                  const stdDev = Math.max(1, Math.sqrt(st.var));
                  const steps = 60;
                  const points: string[] = [];
                  const xMin = 50;
                  const xMax = 100;

                  for (let s = 0; s <= steps; s++) {
                    const xVal = xMin + (s / steps) * (xMax - xMin);
                    const z = (xVal - st.mean) / stdDev;
                    const gaussianY = st.yBase + 0.12 * Math.exp(-0.5 * z * z);
                    const pt = mathToDesign(xVal, gaussianY, scale);
                    if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
                      points.push(`${s === 0 ? "M" : "L"} ${pt.x} ${pt.y}`);
                    }
                  }
                  const ptRightBase = mathToDesign(xMax, st.yBase, scale);
                  const ptLeftBase = mathToDesign(xMin, st.yBase, scale);
                  if (
                    Number.isFinite(ptRightBase.x) &&
                    Number.isFinite(ptRightBase.y) &&
                    Number.isFinite(ptLeftBase.x) &&
                    Number.isFinite(ptLeftBase.y)
                  ) {
                    points.push(`L ${ptRightBase.x} ${ptRightBase.y}`);
                    points.push(`L ${ptLeftBase.x} ${ptLeftBase.y} Z`);
                  }

                  const pathD = points.join(" ");
                  const ptMeanCenter = mathToDesign(st.mean, st.yBase, scale);
                  const ptMeanTop = mathToDesign(
                    st.mean,
                    st.yBase + 0.13,
                    scale,
                  );
                  const ptTotalMeanAtLayer = mathToDesign(
                    strat.totalMean,
                    st.yBase,
                    scale,
                  );

                  return (
                    <g key={`strata-vis-${i}`}>
                      {/* 高斯分布半透明包络线 */}
                      <path
                        d={pathD}
                        fill={withAlpha(st.color, 0.2)}
                        stroke={st.color}
                        strokeWidth={2}
                      />

                      {/* 组内基线 */}
                      <line
                        x1={ptLeftBase.x}
                        y1={ptLeftBase.y}
                        x2={ptRightBase.x}
                        y2={ptRightBase.y}
                        stroke={withAlpha(st.color, 0.35)}
                        strokeWidth={1.5}
                      />

                      {/* 该层均值重心垂直虚线 */}
                      {Number.isFinite(ptMeanCenter.x) &&
                        Number.isFinite(ptMeanTop.y) && (
                          <line
                            x1={ptMeanCenter.x}
                            y1={ptMeanTop.y}
                            x2={ptMeanCenter.x}
                            y2={ptMeanCenter.y}
                            stroke={st.color}
                            strokeWidth={2}
                            strokeDasharray="4 2"
                          />
                        )}

                      {/* 该层名称与参数 Badge */}
                      {(() => {
                        const ptBadge = mathToDesign(
                          48,
                          st.yBase + 0.11,
                          scale,
                        );
                        if (
                          !Number.isFinite(ptBadge.x) ||
                          !Number.isFinite(ptBadge.y)
                        )
                          return null;
                        return (
                          <g>
                            <rect
                              x={ptBadge.x}
                              y={ptBadge.y - 12}
                              width={245}
                              height={22}
                              rx={4}
                              fill={withAlpha(st.color, 0.15)}
                              stroke={st.color}
                            />
                            <text
                              x={ptBadge.x + 8}
                              y={ptBadge.y + 3}
                              fill={st.color}
                              fontSize={fontScale(10)}
                              fontWeight="bold"
                            >
                              {st.name}: N{toSub(i + 1)} = {st.N}人(抽{st.n}人)
                              均值x̄{toSub(i + 1)} = {st.mean} 方差s
                              {toSub(i + 1)}² = {st.var}
                            </text>
                          </g>
                        );
                      })()}

                      {/* 离差跨度指示段 (连接该层均值与总体均值) */}
                      {Math.abs(st.mean - strat.totalMean) > 0.5 &&
                        Number.isFinite(ptMeanCenter.x) &&
                        Number.isFinite(ptTotalMeanAtLayer.x) && (
                          <g key={`diff-line-${i}`}>
                            <line
                              x1={ptMeanCenter.x}
                              y1={ptMeanCenter.y - 10}
                              x2={ptTotalMeanAtLayer.x}
                              y2={ptTotalMeanAtLayer.y - 10}
                              stroke={st.color}
                              strokeWidth={1.5}
                              strokeDasharray="2 2"
                            />
                            <text
                              x={(ptMeanCenter.x + ptTotalMeanAtLayer.x) / 2}
                              y={ptMeanCenter.y - 13}
                              textAnchor="middle"
                              fill={st.color}
                              fontSize={fontScale(9)}
                              fontWeight="bold"
                            >
                              |x̄{toSub(i + 1)} - x̄| ={" "}
                              {(st.mean - strat.totalMean).toFixed(1)}
                            </text>
                          </g>
                        )}
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* 4. 底部总体方差合成 Stack Bar (数形结合拆解：【组内方差贡献】+【组间离差贡献】=【总体方差】) */}
          {(() => {
            const intraVar =
              strat.strataWeights[0] * strat.strataVars[0] +
              strat.strataWeights[1] * strat.strataVars[1] +
              strat.strataWeights[2] * strat.strataVars[2];
            const interMeanVar = Math.max(0, strat.totalVar - intraVar);

            const ptBarStart = mathToDesign(50, -0.04, scale);
            const totalWidthPx = 480;
            const barHeight = 24;

            const intraRatio =
              strat.totalVar > 0 ? intraVar / strat.totalVar : 0.5;
            const intraWidthPx = intraRatio * totalWidthPx;
            const interWidthPx = totalWidthPx - intraWidthPx;

            if (
              !Number.isFinite(ptBarStart.x) ||
              !Number.isFinite(ptBarStart.y)
            )
              return null;

            return (
              <g key="total-variance-stack-bar">
                {/* 背景框 */}
                <rect
                  x={ptBarStart.x - 10}
                  y={ptBarStart.y - 28}
                  width={totalWidthPx + 160}
                  height={54}
                  rx={8}
                  fill={withAlpha(MATH_COLORS.function, 0.06)}
                  stroke={withAlpha(MATH_COLORS.function, 0.25)}
                />
                <text
                  x={ptBarStart.x}
                  y={ptBarStart.y - 10}
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(11.5)}
                  fontWeight="bold"
                >
                  高考必考总体方差分解合成：s² = {strat.totalVar.toFixed(2)}
                </text>

                {/* 组内方差贡献柱 (蓝色) */}
                <rect
                  x={ptBarStart.x}
                  y={ptBarStart.y}
                  width={intraWidthPx}
                  height={barHeight}
                  rx={4}
                  fill={withAlpha(MATH_COLORS.function, 0.8)}
                />
                <text
                  x={ptBarStart.x + intraWidthPx / 2}
                  y={ptBarStart.y + 16}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  组内散度贡献: {intraVar.toFixed(2)} (
                  {((intraVar / Math.max(1, strat.totalVar)) * 100).toFixed(0)}
                  %)
                </text>

                {/* 组间均值离差贡献柱 (橙色) */}
                <rect
                  x={ptBarStart.x + intraWidthPx}
                  y={ptBarStart.y}
                  width={interWidthPx}
                  height={barHeight}
                  rx={4}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
                />
                {interWidthPx > 40 && (
                  <text
                    x={ptBarStart.x + intraWidthPx + interWidthPx / 2}
                    y={ptBarStart.y + 16}
                    textAnchor="middle"
                    fill={MATH_COLORS.white}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                  >
                    组间重心离差: {interMeanVar.toFixed(2)} (
                    {(
                      (interMeanVar / Math.max(1, strat.totalVar)) *
                      100
                    ).toFixed(0)}
                    %)
                  </text>
                )}
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
};
