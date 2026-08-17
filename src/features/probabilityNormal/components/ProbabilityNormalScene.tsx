import { useMemo } from "react";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels } from "@/utils/labelAvoider";
import {
  generateHistogramBins,
  estimateHistogramStats,
  normalPdf,
  calcSymmetricNormalIntervals,
} from "@/math/probabilityNormal";

interface TooltipBinData {
  xStart: number;
  xEnd: number;
  mid: number;
  width: number;
  density: number;
  frequency: number;
  count: number;
}

interface ProbabilityNormalSceneProps {
  params: {
    mu: number;
    sigma: number;
    binCount: number;
    sampleSize: number;
    skewness?: number;
    percentileP?: number;
    blend?: number;
    x0?: number;
    x1?: number;
    x2?: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  studyMode: "histogram" | "normalFit" | "paramsShape" | "sigmaRule";
  showStatsLines?: boolean;
  showFrequencyLine?: boolean;
  showSigmaIntervals?: boolean;
  showBenchmarkNormal?: boolean;
  onParamChange: (key: string, value: number) => void;
  /** Tooltip 事件回调 */
  onBinMouseEnter?: (bin: TooltipBinData, e: React.MouseEvent) => void;
  onBinMouseMove?: (e: React.MouseEvent) => void;
  onBinMouseLeave?: () => void;
}

export function ProbabilityNormalScene({
  params,
  scale,
  vp,
  fontScale,
  studyMode,
  showStatsLines = true,
  showFrequencyLine = false,
  showSigmaIntervals = false,
  showBenchmarkNormal = true,
  onParamChange,
  onBinMouseEnter,
  onBinMouseMove,
  onBinMouseLeave,
}: ProbabilityNormalSceneProps) {
  const {
    mu,
    sigma,
    binCount,
    sampleSize,
    skewness = 0,
    percentileP = 50,
    blend = 0.5,
    x0 = -1,
    x1 = -1,
    x2 = 1,
  } = params;
  const safeSigma = Math.max(0.1, sigma);

  // 1. 直方图分组与估计数据
  const bins = useMemo(() => {
    return generateHistogramBins(mu, safeSigma, binCount, sampleSize, skewness);
  }, [mu, safeSigma, binCount, sampleSize, skewness]);

  const stats = useMemo(() => {
    return estimateHistogramStats(bins, percentileP);
  }, [bins, percentileP]);

  // 直方图在特定横坐标处的高度采样辅助函数
  const getHistDensityAt = useMemo(() => {
    return (x: number): number => {
      for (const bin of bins) {
        if (x >= bin.xStart && x <= bin.xEnd) {
          return bin.density;
        }
      }
      return 0.1;
    };
  }, [bins]);

  // 2. 正态分布密度曲线 Path 采样 (x 从 -6 到 6)
  const curvePathD = useMemo(() => {
    const points: string[] = [];
    const step = 0.04;
    for (let x = -6; x <= 6; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(
        `${x === -6 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      );
    }
    return points.join(" ");
  }, [mu, safeSigma, scale]);

  // 基准 N(0, 1) 密度曲线 Path
  const benchmarkCurvePathD = useMemo(() => {
    const points: string[] = [];
    const step = 0.05;
    for (let x = -6; x <= 6; x += step) {
      const y = normalPdf(x, 0, 1);
      const pt = mathToDesign(x, y, scale);
      points.push(
        `${x === -6 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      );
    }
    return points.join(" ");
  }, [scale]);

  // 3. 任意区间阴影 Path 采样 ([x1, x2])
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);

  const shadowPathD = useMemo(() => {
    const points: string[] = [];
    const step = 0.02;

    const startPt = mathToDesign(minX, 0, scale);
    points.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);

    for (let x = minX; x <= maxX; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
    }

    const endY = normalPdf(maxX, mu, safeSigma);
    const endPt1 = mathToDesign(maxX, endY, scale);
    const endPt2 = mathToDesign(maxX, 0, scale);
    points.push(`L ${endPt1.x.toFixed(1)} ${endPt1.y.toFixed(1)}`);
    points.push(`L ${endPt2.x.toFixed(1)} ${endPt2.y.toFixed(1)}`);

    points.push("Z");
    return points.join(" ");
  }, [minX, maxX, mu, safeSigma, scale]);

  // 4. 对称性阴影采样 (x0 与 2μ - x0)
  const symData = useMemo(() => {
    return calcSymmetricNormalIntervals(mu, safeSigma, x0);
  }, [mu, safeSigma, x0]);

  // 左侧尾部阴影 [-6, symData.leftX]
  const leftTailShadowPathD = useMemo(() => {
    const leftBound = -6;
    const rightBound = symData.leftX;
    if (rightBound <= leftBound) return "";

    const points: string[] = [];
    const step = 0.04;
    const startPt = mathToDesign(leftBound, 0, scale);
    points.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);

    for (let x = leftBound; x <= rightBound; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
    }

    const endY = normalPdf(rightBound, mu, safeSigma);
    const endPt1 = mathToDesign(rightBound, endY, scale);
    const endPt2 = mathToDesign(rightBound, 0, scale);
    points.push(`L ${endPt1.x.toFixed(1)} ${endPt1.y.toFixed(1)}`);
    points.push(`L ${endPt2.x.toFixed(1)} ${endPt2.y.toFixed(1)}`);
    points.push("Z");
    return points.join(" ");
  }, [symData.leftX, mu, safeSigma, scale]);

  // 右侧尾部阴影 [symData.rightX, 6]
  const rightTailShadowPathD = useMemo(() => {
    const leftBound = symData.rightX;
    const rightBound = 6;
    if (leftBound >= rightBound) return "";

    const points: string[] = [];
    const step = 0.04;
    const startPt = mathToDesign(leftBound, 0, scale);
    points.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);

    for (let x = leftBound; x <= rightBound; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
    }

    const endY = normalPdf(rightBound, mu, safeSigma);
    const endPt1 = mathToDesign(rightBound, endY, scale);
    const endPt2 = mathToDesign(rightBound, 0, scale);
    points.push(`L ${endPt1.x.toFixed(1)} ${endPt1.y.toFixed(1)}`);
    points.push(`L ${endPt2.x.toFixed(1)} ${endPt2.y.toFixed(1)}`);
    points.push("Z");
    return points.join(" ");
  }, [symData.rightX, mu, safeSigma, scale]);

  // 5. 特征数标示线与优化避让标签
  const labelEntries = useMemo(() => {
    if (!showStatsLines || studyMode !== "histogram") return [];

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
  }, [stats, scale, showStatsLines, studyMode, percentileP, getHistDensityAt]);

  const placedLabels = useMemo(() => {
    return avoidLabels(labelEntries, { fontScale, stepY: 14 });
  }, [labelEntries, fontScale]);

  // 6. 拖拽处理（InteractivePoint 返回数学坐标 mathPt）
  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    const clamped = Math.max(-5, Math.min(5, Math.round(mathPt.x * 10) / 10));
    onParamChange("x0", clamped);
  };

  const handleDragX1 = (mathPt: { x: number; y: number }) => {
    const clamped = Math.max(-5, Math.min(5, Math.round(mathPt.x * 10) / 10));
    onParamChange("x1", clamped);
  };

  const handleDragX2 = (mathPt: { x: number; y: number }) => {
    const clamped = Math.max(-5, Math.min(5, Math.round(mathPt.x * 10) / 10));
    onParamChange("x2", clamped);
  };

  return (
    <g>
      {/* 坐标轴与网格 (标准组件) */}
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={1}
        yStep={0.1}
      />

      {/* ─── 模式 1：直方图与数字特征 ────────────────────────────────────────── */}
      {studyMode === "histogram" && (
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
                points.push(
                  `M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`,
                );
                for (const bin of bins) {
                  const pt = mathToDesign(bin.mid, bin.density, scale);
                  points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
                }
                const endPt = mathToDesign(
                  bins[bins.length - 1].xEnd,
                  0,
                  scale,
                );
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
      )}

      {/* ─── 模式 2：极限逼近与正态拟合 ──────────────────────────────────────── */}
      {studyMode === "normalFit" && (
        <g>
          {/* 区间面积阴影 [x1, x2] */}
          <path
            d={shadowPathD}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.35)}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />

          {/* 直方图柱带透明过渡 */}
          {bins.map((bin) => {
            const leftTop = mathToDesign(bin.xStart, bin.density, scale);
            const rightBottom = mathToDesign(bin.xEnd, 0, scale);
            const rectWidth = Math.max(1, rightBottom.x - leftTop.x);
            const rectHeight = Math.max(1, rightBottom.y - leftTop.y);

            return (
              <rect
                key={bin.index}
                x={leftTop.x}
                y={leftTop.y}
                width={rectWidth}
                height={rectHeight}
                fill={withAlpha(MATH_COLORS.barFill, 0.45 * (1 - blend * 0.5))}
                stroke={withAlpha(
                  MATH_COLORS.barBorder,
                  0.8 * (1 - blend * 0.3),
                )}
                strokeWidth={1.2}
              />
            );
          })}

          {/* 正态拟合曲线 */}
          <path
            d={curvePathD}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* 顶点高度与参数标注 */}
          {(() => {
            const peakY = normalPdf(mu, mu, safeSigma);
            const muPt = mathToDesign(mu, peakY, scale);
            // 防止贴画布顶
            const isNearTop = muPt.y < 40;
            const textY = isNearTop ? muPt.y + fontScale(16) : muPt.y - 8;

            return (
              <g>
                <circle
                  cx={muPt.x}
                  cy={muPt.y}
                  r={4}
                  fill={MATH_COLORS.paramPrimary}
                />
                <text
                  x={muPt.x}
                  y={textY}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.paramPrimary}
                  textAnchor="middle"
                  className="font-bold select-none drop-shadow-sm"
                >
                  f(μ) = {peakY.toFixed(3)}
                </text>
              </g>
            );
          })()}

          {/* x1, x2 拖拽控制点 */}
          <InteractivePoint
            cx={x1}
            cy={0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX1}
            color={MATH_COLORS.paramTertiary}
            label={`x₁ = ${x1.toFixed(1)}`}
            fontScale={fontScale}
          />
          <InteractivePoint
            cx={x2}
            cy={0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX2}
            color={MATH_COLORS.paramTertiary}
            label={`x₂ = ${x2.toFixed(1)}`}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ─── 模式 3：正态参数与形态探究 ──────────────────────────────────────── */}
      {studyMode === "paramsShape" && (
        <g>
          {/* 基准 N(0,1) 曲线对比 */}
          {showBenchmarkNormal && (
            <g>
              <path
                d={benchmarkCurvePathD}
                fill="none"
                stroke={MATH_COLORS.textMuted}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              {(() => {
                const benchPt = mathToDesign(0, 0.4, scale);
                return (
                  <text
                    x={benchPt.x + 12}
                    y={benchPt.y - 4}
                    fontSize={fontScale(10)}
                    fill={MATH_COLORS.textMuted}
                    className="select-none font-medium"
                  >
                    N(0, 1) 基准
                  </text>
                );
              })()}
            </g>
          )}

          {/* 当前 N(μ, σ²) 曲线 */}
          <path
            d={curvePathD}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 对称轴 x = μ 垂线与优化标注 */}
          {(() => {
            const peakY = normalPdf(mu, mu, safeSigma);
            const muPt = mathToDesign(mu, peakY, scale);
            const axisPt = mathToDesign(mu, 0, scale);
            const isNearTop = muPt.y < 45;
            const labelY = isNearTop ? muPt.y + fontScale(16) : muPt.y - 10;

            return (
              <g>
                <line
                  x1={muPt.x}
                  y1={axisPt.y}
                  x2={muPt.x}
                  y2={muPt.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                />
                <circle
                  cx={muPt.x}
                  cy={muPt.y}
                  r={4}
                  fill={MATH_COLORS.paramPrimary}
                />
                <text
                  x={muPt.x}
                  y={labelY}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.paramPrimary}
                  textAnchor="middle"
                  className="font-bold select-none drop-shadow-sm"
                >
                  对称轴 x = {mu.toFixed(1)} (f_max={peakY.toFixed(3)})
                </text>
              </g>
            );
          })()}

          {/* 左右拐点标注 (μ - σ, μ + σ) - 优化避让与清晰度 */}
          {(() => {
            const inflectY = normalPdf(mu - safeSigma, mu, safeSigma);
            const pL = mathToDesign(mu - safeSigma, inflectY, scale);
            const pR = mathToDesign(mu + safeSigma, inflectY, scale);
            // 根据 σ 调整文字偏移距离
            const offsetDist = Math.max(8, 12 * Math.min(1, safeSigma));

            return (
              <g>
                <circle
                  cx={pL.x}
                  cy={pL.y}
                  r={4}
                  fill={MATH_COLORS.paramSecondary}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <circle
                  cx={pR.x}
                  cy={pR.y}
                  r={4}
                  fill={MATH_COLORS.paramSecondary}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <text
                  x={pL.x - offsetDist}
                  y={pL.y - 6}
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.paramSecondary}
                  textAnchor="end"
                  className="font-bold select-none drop-shadow-sm"
                >
                  拐点 μ-σ = {(mu - safeSigma).toFixed(2)}
                </text>
                <text
                  x={pR.x + offsetDist}
                  y={pR.y - 6}
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.paramSecondary}
                  textAnchor="start"
                  className="font-bold select-none drop-shadow-sm"
                >
                  拐点 μ+σ = {(mu + safeSigma).toFixed(2)}
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* ─── 模式 4：对称性与高考 3-σ 解题 ────────────────────────────────────── */}
      {studyMode === "sigmaRule" && (
        <g>
          {/* 1. 3-σ 区间高亮 (3σ -> 2σ -> 1σ 梯级嵌套) */}
          {showSigmaIntervals && (
            <g>
              {/* 3σ 区间 (99.73%) */}
              {(() => {
                const s3L = mu - 3 * safeSigma;
                const s3R = mu + 3 * safeSigma;
                const points: string[] = [];
                const start = mathToDesign(s3L, 0, scale);
                points.push(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
                for (let x = s3L; x <= s3R; x += 0.04) {
                  const pt = mathToDesign(
                    x,
                    normalPdf(x, mu, safeSigma),
                    scale,
                  );
                  points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
                }
                const end = mathToDesign(s3R, 0, scale);
                points.push(`L ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`);
                return (
                  <path
                    d={points.join(" ")}
                    fill={MATH_COLORS.sigma3Fill}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                );
              })()}

              {/* 2σ 区间 (95.45%) */}
              {(() => {
                const s2L = mu - 2 * safeSigma;
                const s2R = mu + 2 * safeSigma;
                const points: string[] = [];
                const start = mathToDesign(s2L, 0, scale);
                points.push(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
                for (let x = s2L; x <= s2R; x += 0.04) {
                  const pt = mathToDesign(
                    x,
                    normalPdf(x, mu, safeSigma),
                    scale,
                  );
                  points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
                }
                const end = mathToDesign(s2R, 0, scale);
                points.push(`L ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`);
                return (
                  <path
                    d={points.join(" ")}
                    fill={MATH_COLORS.sigma2Fill}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={1}
                    strokeDasharray="4 2"
                  />
                );
              })()}

              {/* 1σ 区间 (68.27%) */}
              {(() => {
                const s1L = mu - safeSigma;
                const s1R = mu + safeSigma;
                const points: string[] = [];
                const start = mathToDesign(s1L, 0, scale);
                points.push(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
                for (let x = s1L; x <= s1R; x += 0.04) {
                  const pt = mathToDesign(
                    x,
                    normalPdf(x, mu, safeSigma),
                    scale,
                  );
                  points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
                }
                const end = mathToDesign(s1R, 0, scale);
                points.push(`L ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`);
                return (
                  <path
                    d={points.join(" ")}
                    fill={MATH_COLORS.sigma1Fill}
                    stroke={MATH_COLORS.paramPrimary}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                );
              })()}
            </g>
          )}

          {/* 2. 对称镜像双色阴影可视化 (P(X ≤ min) = P(X ≥ max)) */}
          {!showSigmaIntervals && (
            <g>
              {/* 左侧尾部阴影 */}
              {leftTailShadowPathD && (
                <path
                  d={leftTailShadowPathD}
                  fill={withAlpha(MATH_COLORS.paramTertiary, 0.35)}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.5}
                />
              )}
              {/* 右侧对称镜像尾部阴影 */}
              {rightTailShadowPathD && (
                <path
                  d={rightTailShadowPathD}
                  fill={withAlpha(MATH_COLORS.setB, 0.35)}
                  stroke={MATH_COLORS.setB}
                  strokeWidth={1.5}
                />
              )}

              {/* 对称中间区间高度连线与标注 (置于曲线水平高位，避免遮挡横轴) */}
              {(() => {
                const heightY = normalPdf(symData.leftX, mu, safeSigma);
                const leftPt = mathToDesign(symData.leftX, heightY, scale);
                const rightPt = mathToDesign(symData.rightX, heightY, scale);
                const midX = (leftPt.x + rightPt.x) / 2;

                return (
                  <g>
                    <line
                      x1={leftPt.x}
                      y1={leftPt.y}
                      x2={rightPt.x}
                      y2={rightPt.y}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                    <circle
                      cx={leftPt.x}
                      cy={leftPt.y}
                      r={3}
                      fill={MATH_COLORS.paramSecondary}
                    />
                    <circle
                      cx={rightPt.x}
                      cy={rightPt.y}
                      r={3}
                      fill={MATH_COLORS.paramSecondary}
                    />
                    <text
                      x={midX}
                      y={leftPt.y - 8}
                      fontSize={fontScale(11)}
                      fill={MATH_COLORS.paramSecondary}
                      textAnchor="middle"
                      className="font-bold select-none drop-shadow-sm"
                    >
                      对称区间 P = {(symData.centerProb * 100).toFixed(1)}%
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* 正态曲线主体 */}
          <path
            d={curvePathD}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 对称轴 */}
          {(() => {
            const peakY = normalPdf(mu, mu, safeSigma);
            const muPt = mathToDesign(mu, peakY, scale);
            const axisPt = mathToDesign(mu, 0, scale);
            const isNearTop = muPt.y < 40;
            const textY = isNearTop ? muPt.y + fontScale(16) : muPt.y - 8;

            return (
              <g>
                <line
                  x1={muPt.x}
                  y1={axisPt.y}
                  x2={muPt.x}
                  y2={muPt.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                />
                <text
                  x={muPt.x}
                  y={textY}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.paramPrimary}
                  textAnchor="middle"
                  className="font-bold select-none drop-shadow-sm"
                >
                  μ = {mu.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* 基准点拖拽控制点 x0 */}
          <InteractivePoint
            cx={x0}
            cy={0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramTertiary}
            label={`x₀ = ${x0.toFixed(1)}`}
            fontScale={fontScale}
          />

          {/* 对称镜像点 (只读显示，标注置于点上方，避免遮挡 X 轴刻度) */}
          {(() => {
            const symPt = mathToDesign(symData.xSym, 0, scale);
            return (
              <g>
                <circle
                  cx={symPt.x}
                  cy={symPt.y}
                  r={5}
                  fill={MATH_COLORS.setB}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <text
                  x={symPt.x}
                  y={symPt.y - fontScale(10)}
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.setB}
                  textAnchor="middle"
                  className="font-bold select-none drop-shadow-sm"
                >
                  2μ-x₀ = {symData.xSym.toFixed(1)}
                </text>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
}
