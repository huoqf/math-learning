import { useMemo } from "react";
import type {
  DistributionResult,
  DistributionComparisonResult,
  DecisionScenarioResult,
} from "@/math/probabilityDistribution";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CANVAS_COLORS } from "@/theme";
import { ProbabilityDistributionLinearScene } from "./ProbabilityDistributionLinearScene";
import { ProbabilityDistributionBarScene } from "./ProbabilityDistributionBarScene";
import { ProbabilityDistributionCompareScene } from "./ProbabilityDistributionCompareScene";
import { ProbabilityDistributionDecisionScene } from "./ProbabilityDistributionDecisionScene";

interface ProbabilityDistributionSceneProps {
  distResult: DistributionResult;
  transformedDist?: DistributionResult;
  comparisonResult?: DistributionComparisonResult;
  decisionResult?: DecisionScenarioResult;
  studyMode:
    | "binomial"
    | "hypergeometric"
    | "compare"
    | "linear"
    | "decision"
    | "general";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (baseSize: number) => number;
  linearA?: number;
  linearB?: number;
  onProbabilityChange?: (index: number, newP: number) => void;
}

export function ProbabilityDistributionScene({
  distResult,
  transformedDist,
  comparisonResult,
  decisionResult,
  studyMode,
  scale,
  vp,
  fontScale,
  linearA = 2,
  linearB = 1,
  onProbabilityChange,
}: ProbabilityDistributionSceneProps) {
  const { outcomes, mean, stdDev } = distResult;

  // 1. 固定稳定的纵轴 Y 标尺 0 ~ 1.0
  const yTicks = [0.2, 0.4, 0.6, 0.8, 1.0];

  // 确定基准线坐标
  const yAxisZero = mathToDesign(0, 0, scale);
  const yAxisMax = mathToDesign(0, 1.0, scale);

  // 动态计算 X 轴端点与安全边距
  const maxXVal = useMemo(() => {
    if (studyMode === "compare" && comparisonResult) {
      return comparisonResult.sampleN + 0.6;
    }
    if (studyMode === "decision") {
      return 4.8;
    }
    if (studyMode === "linear" && transformedDist) {
      const allX = [
        ...outcomes.map((o) => o.x),
        ...transformedDist.outcomes.map((o) => o.x),
      ];
      return Math.max(...allX) + 0.8;
    }
    return Math.max(...outcomes.map((o) => o.x), 0) + 0.6;
  }, [studyMode, comparisonResult, transformedDist, outcomes]);

  const minXVal = useMemo(() => {
    if (studyMode === "linear" && transformedDist) {
      const allX = [
        ...outcomes.map((o) => o.x),
        ...transformedDist.outcomes.map((o) => o.x),
      ];
      return Math.min(0, ...allX) - 0.6;
    }
    return -0.5;
  }, [studyMode, transformedDist, outcomes]);

  const rawAxisMin = mathToDesign(minXVal, 0, scale);
  const rawAxisMax = mathToDesign(maxXVal, 0, scale);

  // 保证 Y 轴刻度文本永远在左侧安全边距之内 (绝不截断)
  const leftSafeMargin = Math.max(38, rawAxisMin.x);
  const rightSafeMargin = Math.min(
    810,
    Math.max(rawAxisMax.x, leftSafeMargin + 200),
  );

  // 期望 E(X) 物理杠杆坐标
  const meanDesign = mathToDesign(mean, 0, scale);

  // 方差波动带 [E(X) - σ, E(X) + σ]
  const sigmaMin = Math.max(minXVal + 0.2, mean - stdDev);
  const sigmaMax = Math.min(maxXVal - 0.2, mean + stdDev);
  const sigmaMinDesign = mathToDesign(sigmaMin, 0, scale);
  const sigmaMaxDesign = mathToDesign(sigmaMax, 0, scale);

  // 柱体宽度
  const halfBarWidthPx = Math.max(10, Math.min(26, (0.34 * scale.scaleX) / 2));

  const isBarMode =
    studyMode === "binomial" ||
    studyMode === "hypergeometric" ||
    studyMode === "general";

  return (
    <g className="select-none">
      {/* ================= 模式 4：线性变换 Y=aX+b 专属上下分层双轨道设计 ================= */}
      {studyMode === "linear" && transformedDist ? (
        <ProbabilityDistributionLinearScene
          distResult={distResult}
          transformedDist={transformedDist}
          scale={scale}
          fontScale={fontScale}
          linearA={linearA}
          linearB={linearB}
          leftSafeMargin={leftSafeMargin}
          rightSafeMargin={rightSafeMargin}
          halfBarWidthPx={halfBarWidthPx}
          sigmaMinDesign={sigmaMinDesign}
          sigmaMaxDesign={sigmaMaxDesign}
        />
      ) : (
        /* ================= 其它模式：标准单轨道设计 ================= */
        <>
          {/* 1. 背景静止网格与 Y 轴刻度 */}
          {yTicks.map((pVal) => {
            const linePos = mathToDesign(0, pVal, scale);
            return (
              <g key={`grid-y-${pVal}`}>
                <line
                  x1={leftSafeMargin}
                  y1={linePos.y}
                  x2={rightSafeMargin + 20}
                  y2={linePos.y}
                  stroke={CANVAS_COLORS.grid}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text
                  x={leftSafeMargin - 8}
                  y={linePos.y + fontScale(4)}
                  fill={CANVAS_COLORS.labelText}
                  fontSize={fontScale(10.5)}
                  textAnchor="end"
                  fontWeight="600"
                  className="font-mono"
                >
                  {pVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* 2. 主 X 坐标轴与箭头 */}
          <line
            x1={leftSafeMargin - 10}
            y1={yAxisZero.y}
            x2={rightSafeMargin + 25}
            y2={yAxisZero.y}
            stroke={CANVAS_COLORS.axis}
            strokeWidth={2}
          />
          <polygon
            points={`${rightSafeMargin + 32},${yAxisZero.y} ${
              rightSafeMargin + 22
            },${yAxisZero.y - 4} ${rightSafeMargin + 22},${yAxisZero.y + 4}`}
            fill={CANVAS_COLORS.axis}
          />
          <text
            x={rightSafeMargin + 38}
            y={yAxisZero.y + fontScale(4)}
            fill={CANVAS_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {studyMode === "decision" ? "事件" : "x"}
          </text>

          {/* 3. 基础模式与超几何/一般模式的柱状图 */}
          {isBarMode && (
            <ProbabilityDistributionBarScene
              studyMode={studyMode as "binomial" | "hypergeometric" | "general"}
              distResult={distResult}
              scale={scale}
              vp={vp}
              fontScale={fontScale}
              yAxisZero={yAxisZero}
              yAxisMax={yAxisMax}
              sigmaMinDesign={sigmaMinDesign}
              sigmaMaxDesign={sigmaMaxDesign}
              meanDesign={meanDesign}
              halfBarWidthPx={halfBarWidthPx}
              onProbabilityChange={onProbabilityChange}
            />
          )}

          {/* 4. 双分布逼近同屏对比 (超几何 vs 二项) */}
          {studyMode === "compare" && comparisonResult && (
            <ProbabilityDistributionCompareScene
              comparisonResult={comparisonResult}
              scale={scale}
              fontScale={fontScale}
              yAxisZero={yAxisZero}
              yAxisMax={yAxisMax}
              meanDesign={meanDesign}
              mean={mean}
              rightSafeMargin={rightSafeMargin}
              halfBarWidthPx={halfBarWidthPx}
            />
          )}

          {/* 5. 决策模型对比 */}
          {studyMode === "decision" && decisionResult && (
            <ProbabilityDistributionDecisionScene
              decisionResult={decisionResult}
              scale={scale}
              fontScale={fontScale}
              yAxisMax={yAxisMax}
              rightSafeMargin={rightSafeMargin}
            />
          )}
        </>
      )}
    </g>
  );
}
