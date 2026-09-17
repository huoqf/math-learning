import { useMemo } from "react";
import { CoordinateGrid } from "@/components/Math";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import {
  generateHistogramBins,
  normalPdf,
  calcSymmetricNormalIntervals,
} from "@/math/probabilityNormal";
import type { HistogramBin } from "@/math/probabilityNormal";
import { ProbabilityNormalNormalFitScene } from "./ProbabilityNormalNormalFitScene";
import { ProbabilityNormalParamsShapeScene } from "./ProbabilityNormalParamsShapeScene";
import { ProbabilityNormalSigmaRuleScene } from "./ProbabilityNormalSigmaRuleScene";

interface ProbabilityNormalSceneProps {
  params: {
    mu: number;
    sigma: number;
    binCount: number;
    sampleSize: number;
    blend?: number;
    x0?: number;
    x1?: number;
    x2?: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  studyMode: "normalFit" | "paramsShape" | "sigmaRule";
  showSigmaIntervals?: boolean;
  showBenchmarkNormal?: boolean;
  onParamChange: (key: string, value: number) => void;
  /** Tooltip 事件回调（挂在 normalFit 直方图柱体上，供学生读取该组的频率/组距） */
  onBinMouseEnter?: (bin: HistogramBin, e: React.MouseEvent) => void;
  onBinMouseMove?: (e: React.MouseEvent) => void;
  onBinMouseLeave?: () => void;
}

export function ProbabilityNormalScene({
  params,
  scale,
  vp,
  fontScale,
  studyMode,
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
    blend = 0.5,
    x0 = -1,
    x1 = -1,
    x2 = 1,
  } = params;
  const safeSigma = Math.max(0.1, sigma);

  // 1. 直方图分组数据
  //    分册边界（审计 P1-3 决策）：本页直方图只承担"组距细化 → 上底边折线轮廓趋于
  //    光滑正态曲线"的连续化直观；众数/中位数/平均数/百分位数等特征数的精细计算
  //    属必修二 know-stat-percentile，不在此页重复。
  const bins: HistogramBin[] = useMemo(() => {
    return generateHistogramBins(mu, safeSigma, binCount, sampleSize);
  }, [mu, safeSigma, binCount, sampleSize]);

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

      {/* 坐标轴量纲学术标注（新高考规范：明确区分『频率/组距』与『概率密度』） */}
      {(() => {
        const yTopPt = mathToDesign(0, scale.yMax, scale);
        const yLabel =
          studyMode === "normalFit" ? "频率 / 组距" : "概率密度 f(x)";

        return (
          <text
            x={yTopPt.x + fontScale(8)}
            y={yTopPt.y + fontScale(12)}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelText}
            fontWeight="bold"
            className="select-none"
          >
            {yLabel}
          </text>
        );
      })()}

      {/* ─── 模式 1：极限逼近与正态拟合 ──────────────────────────────────────── */}
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
          onBinMouseEnter={onBinMouseEnter}
          onBinMouseMove={onBinMouseMove}
          onBinMouseLeave={onBinMouseLeave}
        />
      )}

      {/* ─── 模式 2：正态参数与形态探究 ──────────────────────────────────────── */}
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

      {/* ─── 模式 3：对称性与高考 3-σ 解题 ────────────────────────────────────── */}
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
