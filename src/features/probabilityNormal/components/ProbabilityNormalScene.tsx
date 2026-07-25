import { useMemo } from "react";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { mathToDesign, designToMath } from "@/utils/coordinate";
import { avoidLabels } from "@/utils/labelAvoider";
import {
  generateHistogramBins,
  estimateHistogramStats,
  normalPdf,
} from "@/math/probabilityNormal";

interface ProbabilityNormalSceneProps {
  params: {
    mu: number;
    sigma: number;
    binCount: number;
    sampleSize: number;
    x1: number;
    x2: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  studyMode: "histogram" | "normalFit" | "sigmaRule";
  showStatsLines?: boolean;
  onParamChange: (key: string, value: number) => void;
}

export function ProbabilityNormalScene({
  params,
  scale,
  vp,
  fontScale,
  studyMode,
  showStatsLines = true,
  onParamChange,
}: ProbabilityNormalSceneProps) {
  const { mu, sigma, binCount, sampleSize, x1, x2 } = params;
  const safeSigma = Math.max(0.1, sigma);

  // 1. 直方图分组与估计数据
  const bins = useMemo(() => {
    return generateHistogramBins(mu, safeSigma, binCount, sampleSize);
  }, [mu, safeSigma, binCount, sampleSize]);

  const stats = useMemo(() => {
    return estimateHistogramStats(bins);
  }, [bins]);

  // 2. 正态分布密度曲线 Path 采样 (x 从 -6 到 6)
  const curvePathD = useMemo(() => {
    const points: string[] = [];
    const step = 0.05;
    for (let x = -6; x <= 6; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(
        `${x === -6 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      );
    }
    return points.join(" ");
  }, [mu, safeSigma, scale]);

  // 3. 区间阴影 Path 采样 ([x1, x2])
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);

  const shadowPathD = useMemo(() => {
    const points: string[] = [];
    const step = 0.02;

    // 起始点 (minX, 0)
    const startPt = mathToDesign(minX, 0, scale);
    points.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);

    // 沿着密度曲线从 minX 走到 maxX
    for (let x = minX; x <= maxX; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
    }

    // 处理终点 (maxX, f(maxX)) 落地到 (maxX, 0)
    const endY = normalPdf(maxX, mu, safeSigma);
    const endPt1 = mathToDesign(maxX, endY, scale);
    const endPt2 = mathToDesign(maxX, 0, scale);
    points.push(`L ${endPt1.x.toFixed(1)} ${endPt1.y.toFixed(1)}`);
    points.push(`L ${endPt2.x.toFixed(1)} ${endPt2.y.toFixed(1)}`);

    points.push("Z");
    return points.join(" ");
  }, [minX, maxX, mu, safeSigma, scale]);

  // 4. 特征数标示线 (众数、中位数、平均数) 与避让标签
  const labelEntries = useMemo(() => {
    if (!showStatsLines || studyMode === "sigmaRule") return [];

    const modeY = Math.max(0.05, normalPdf(stats.mode, mu, safeSigma));
    const medianY = Math.max(0.05, normalPdf(stats.median, mu, safeSigma));
    const meanY = Math.max(0.05, normalPdf(stats.mean, mu, safeSigma));

    const modePt = mathToDesign(stats.mode, modeY, scale);
    const medianPt = mathToDesign(stats.median, medianY, scale);
    const meanPt = mathToDesign(stats.mean, meanY, scale);

    return [
      {
        key: "mode",
        text: `众数 ${stats.mode.toFixed(2)}`,
        x: modePt.x,
        y: modePt.y,
        anchor: "middle" as const,
        dy: -8,
        priority: 3,
      },
      {
        key: "median",
        text: `中位数 ${stats.median.toFixed(2)}`,
        x: medianPt.x,
        y: medianPt.y,
        anchor: "middle" as const,
        dy: -8,
        priority: 2,
      },
      {
        key: "mean",
        text: `平均数 ${stats.mean.toFixed(2)}`,
        x: meanPt.x,
        y: meanPt.y,
        anchor: "middle" as const,
        dy: -8,
        priority: 1,
      },
    ];
  }, [stats, scale, showStatsLines, studyMode, mu, safeSigma]);

  const placedLabels = useMemo(() => {
    return avoidLabels(labelEntries, { fontScale, stepY: 14 });
  }, [labelEntries, fontScale]);

  // 5. 端点 x1, x2 拖拽处理
  const handleDragX1 = (newPx: number) => {
    const mathPt = designToMath(newPx, 0, scale);
    const clampedX = Math.max(-5, Math.min(5, Math.round(mathPt.x * 10) / 10));
    onParamChange("x1", clampedX);
  };

  const handleDragX2 = (newPx: number) => {
    const mathPt = designToMath(newPx, 0, scale);
    const clampedX = Math.max(-5, Math.min(5, Math.round(mathPt.x * 10) / 10));
    onParamChange("x2", clampedX);
  };

  // 渲染端点在坐标系上的设计点坐标
  const x1Design = mathToDesign(x1, 0, scale);
  const x2Design = mathToDesign(x2, 0, scale);

  return (
    <g>
      {/* 网格与坐标轴 (标准统一组件) */}
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={1}
        yStep={0.1}
      />

      {/* A. 区间阴影高亮 (sigmaRule 模式或带有区间分析) */}
      {(studyMode === "sigmaRule" || studyMode === "normalFit") && (
        <path
          d={shadowPathD}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.35)}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      )}

      {/* B. 频率分布直方图 矩形绘制 */}
      {studyMode !== "sigmaRule" &&
        bins.map((bin) => {
          const leftTop = mathToDesign(bin.xStart, bin.density, scale);
          const rightBottom = mathToDesign(bin.xEnd, 0, scale);
          const rectWidth = Math.max(1, rightBottom.x - leftTop.x);
          const rectHeight = Math.max(1, rightBottom.y - leftTop.y);

          return (
            <g key={bin.index}>
              <rect
                x={leftTop.x}
                y={leftTop.y}
                width={rectWidth}
                height={rectHeight}
                fill={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.5}
                className="transition-all duration-200 hover:fill-amber-300/60"
              />
              {/* 矩形顶部概率密度/组距数值极简标注 (宽度充足时显示) */}
              {rectWidth > 32 && bin.density > 0.03 && (
                <text
                  x={leftTop.x + rectWidth / 2}
                  y={leftTop.y - 5}
                  fontSize={fontScale(9)}
                  fill={MATH_COLORS.paramSecondary}
                  textAnchor="middle"
                  className="select-none font-semibold opacity-90"
                >
                  {bin.density.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

      {/* C. 放置数字特征参考虚线 (众数、中位数、平均数) */}
      {showStatsLines && studyMode !== "sigmaRule" && (
        <g>
          {/* 众数线 - 红色 */}
          {(() => {
            const modeY = Math.max(0.05, normalPdf(stats.mode, mu, safeSigma));
            const modePt = mathToDesign(stats.mode, modeY, scale);
            const basePt = mathToDesign(stats.mode, 0, scale);
            return (
              <line
                x1={modePt.x}
                y1={basePt.y}
                x2={modePt.x}
                y2={modePt.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })()}

          {/* 中位数线 - 琥珀黄色 */}
          {(() => {
            const medY = Math.max(0.05, normalPdf(stats.median, mu, safeSigma));
            const medPt = mathToDesign(stats.median, medY, scale);
            const basePt = mathToDesign(stats.median, 0, scale);
            return (
              <line
                x1={medPt.x}
                y1={basePt.y}
                x2={medPt.x}
                y2={medPt.y}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })()}

          {/* 平均数线 - 经典蓝 */}
          {(() => {
            const meanY = Math.max(0.05, normalPdf(stats.mean, mu, safeSigma));
            const meanPt = mathToDesign(stats.mean, meanY, scale);
            const basePt = mathToDesign(stats.mean, 0, scale);
            return (
              <line
                x1={meanPt.x}
                y1={basePt.y}
                x2={meanPt.x}
                y2={meanPt.y}
                stroke={MATH_COLORS.function}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })()}

          {/* 避让标签渲染 */}
          {placedLabels.map((lbl) => {
            let labelColor: string = MATH_COLORS.function;
            if (lbl.key === "mode") labelColor = MATH_COLORS.paramPrimary;
            if (lbl.key === "median") labelColor = MATH_COLORS.paramSecondary;

            return (
              <text
                key={lbl.key}
                x={lbl.x}
                y={lbl.y}
                dy={lbl.finalDy}
                fontSize={fontScale(11)}
                fill={labelColor}
                textAnchor={lbl.anchor}
                className="font-bold select-none drop-shadow-sm"
              >
                {lbl.text}
              </text>
            );
          })}
        </g>
      )}

      {/* D. 正态分布密度曲线 (在 normalFit 或 sigmaRule 模式下高亮展示) */}
      {studyMode !== "histogram" && (
        <path
          d={curvePathD}
          fill="none"
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
      )}

      {/* 峰值对称轴 μ 虚线标示 */}
      {studyMode !== "histogram" && (
        <g>
          {(() => {
            const peakY = normalPdf(mu, mu, safeSigma);
            const muPt = mathToDesign(mu, peakY, scale);
            const axisPt = mathToDesign(mu, 0, scale);
            return (
              <>
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
                  y={muPt.y - 8}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.paramPrimary}
                  textAnchor="middle"
                  className="font-bold select-none"
                >
                  μ = {mu.toFixed(1)}
                </text>
              </>
            );
          })()}
        </g>
      )}

      {/* E. 可拖拽区间端点 InteractivePoint (x1, x2) */}
      {(studyMode === "sigmaRule" || studyMode === "normalFit") && (
        <g>
          {/* x1 拖拽控制点 */}
          <InteractivePoint
            cx={x1Design.x}
            cy={x1Design.y}
            scale={scale}
            vp={vp}
            onDrag={(mathPt) => {
              handleDragX1(scale.originX + mathPt.x * scale.scaleX);
            }}
            color={MATH_COLORS.paramTertiary}
            label={`x₁ = ${x1.toFixed(1)}`}
            fontScale={fontScale}
          />

          {/* x2 拖拽控制点 */}
          <InteractivePoint
            cx={x2Design.x}
            cy={x2Design.y}
            scale={scale}
            vp={vp}
            onDrag={(mathPt) => {
              handleDragX2(scale.originX + mathPt.x * scale.scaleX);
            }}
            color={MATH_COLORS.paramTertiary}
            label={`x₂ = ${x2.toFixed(1)}`}
            fontScale={fontScale}
          />
        </g>
      )}
    </g>
  );
}
