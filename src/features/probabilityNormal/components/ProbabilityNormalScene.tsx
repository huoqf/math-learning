import { useMemo } from "react";
import { CoordinateGrid } from "@/components/Math";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import {
  generateHistogramBins,
  estimateHistogramStats,
  normalPdf,
  calcSymmetricNormalIntervals,
} from "@/math/probabilityNormal";
import type { HistogramBin } from "@/math/probabilityNormal";
import { ProbabilityNormalHistogramScene } from "./ProbabilityNormalHistogramScene";
import type { TooltipBinData } from "./ProbabilityNormalHistogramScene";
import { ProbabilityNormalNormalFitScene } from "./ProbabilityNormalNormalFitScene";
import { ProbabilityNormalParamsShapeScene } from "./ProbabilityNormalParamsShapeScene";
import { ProbabilityNormalSigmaRuleScene } from "./ProbabilityNormalSigmaRuleScene";

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
  const bins: HistogramBin[] = useMemo(() => {
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
        <ProbabilityNormalHistogramScene
          bins={bins}
          stats={stats}
          getHistDensityAt={getHistDensityAt}
          percentileP={percentileP}
          showStatsLines={showStatsLines}
          showFrequencyLine={showFrequencyLine}
          scale={scale}
          fontScale={fontScale}
          onBinMouseEnter={onBinMouseEnter}
          onBinMouseMove={onBinMouseMove}
          onBinMouseLeave={onBinMouseLeave}
        />
      )}

      {/* ─── 模式 2：极限逼近与正态拟合 ──────────────────────────────────────── */}
      {studyMode === "normalFit" && (
        <ProbabilityNormalNormalFitScene
          bins={bins}
          shadowPathD={shadowPathD}
          curvePathD={curvePathD}
          mu={mu}
          safeSigma={safeSigma}
          blend={blend}
          x1={x1}
          x2={x2}
          scale={scale}
          vp={vp}
          fontScale={fontScale}
          onDragX1={handleDragX1}
          onDragX2={handleDragX2}
        />
      )}

      {/* ─── 模式 3：正态参数与形态探究 ──────────────────────────────────────── */}
      {studyMode === "paramsShape" && (
        <ProbabilityNormalParamsShapeScene
          curvePathD={curvePathD}
          benchmarkCurvePathD={benchmarkCurvePathD}
          mu={mu}
          safeSigma={safeSigma}
          showBenchmarkNormal={showBenchmarkNormal}
          scale={scale}
          fontScale={fontScale}
        />
      )}

      {/* ─── 模式 4：对称性与高考 3-σ 解题 ────────────────────────────────────── */}
      {studyMode === "sigmaRule" && (
        <ProbabilityNormalSigmaRuleScene
          curvePathD={curvePathD}
          leftTailShadowPathD={leftTailShadowPathD}
          rightTailShadowPathD={rightTailShadowPathD}
          symData={symData}
          mu={mu}
          safeSigma={safeSigma}
          x0={x0}
          showSigmaIntervals={showSigmaIntervals}
          scale={scale}
          vp={vp}
          fontScale={fontScale}
          onDragX0={handleDragX0}
        />
      )}
    </g>
  );
}
