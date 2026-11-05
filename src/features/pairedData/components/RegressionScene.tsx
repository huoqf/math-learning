import React, { useMemo } from "react";
import {
  CoordinateGrid,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  Point2D,
  RegressionModelType,
  calculateLinearRegression,
  calculateOutlierComparison,
  fitAllRegressionModels,
  selectCurrentFit,
  sampleRegressionCurvePoints,
} from "@/math/pairedData";
import { REGRESSION_ANSWER_STEPS } from "@/data/registries/pairedData";

const SUBSCRIPT_DIGITS = ["₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₁₀"];

interface RegressionSceneProps {
  selectedModel?: RegressionModelType;
  showResidualSquares?: boolean;
  showResidualPlot?: boolean;
  points: Point2D[];
  onPointsChange: (newPoints: Point2D[]) => void;
  presetXName: string;
  presetYName: string;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  targetX?: number;
  xStep?: number;
  yStep?: number;
  activeStep?: number;
  isOutlierScenario?: boolean;
}

export const RegressionScene: React.FC<RegressionSceneProps> = ({
  selectedModel = "linear",
  showResidualSquares = true,
  showResidualPlot = false,
  points,
  onPointsChange,
  presetXName,
  presetYName,
  scale,
  vp,
  fontScale,
  targetX,
  xStep = 1,
  yStep = 1,
  activeStep,
  isOutlierScenario = false,
}) => {
  // 1. 回归模型计算
  const regResult = useMemo(() => {
    return calculateLinearRegression(points);
  }, [points]);

  // 2. 全模型拟合优度计算
  const modelFits = useMemo(() => {
    return fitAllRegressionModels(points);
  }, [points]);

  const currentFit = useMemo(() => {
    return selectCurrentFit(modelFits, selectedModel);
  }, [modelFits, selectedModel]);

  // 2.5 离群点情景：同步计算剔除异常点后的清洗回归线（供同屏双线对比）
  const outlierComp = useMemo(() => {
    if (!isOutlierScenario || selectedModel !== "linear" || points.length < 4) {
      return null;
    }
    return calculateOutlierComparison(points);
  }, [isOutlierScenario, selectedModel, points]);

  const cleanedLineSeg = useMemo(() => {
    if (!outlierComp || !outlierComp.cleaned.isValid) return null;
    const x1 = scale.xMin;
    const x2 = scale.xMax;
    const y1 = outlierComp.cleaned.b * x1 + outlierComp.cleaned.a;
    const y2 = outlierComp.cleaned.b * x2 + outlierComp.cleaned.a;
    return {
      p1: mathToDesign(x1, y1, scale),
      p2: mathToDesign(x2, y2, scale),
      cleaned: outlierComp.cleaned,
    };
  }, [outlierComp, scale]);

  // 分步聚光灯透明度：未分步时全 1，分步时突显当前步重点图元
  const stepSpotlight = (stepGroup: 1 | 2 | 3): number => {
    if (activeStep === undefined) return 1;
    return activeStep === stepGroup ? 1 : 0.35;
  };

  // 3. 生成平滑拟合曲线路径 (动态响应视口数学范围 scale.xMin ~ scale.xMax，顶层 Hook)
  const curvePointsCount = 140;
  const curvePath = useMemo(() => {
    if (!currentFit || !currentFit.isValid) return "";
    const samples = sampleRegressionCurvePoints(
      currentFit,
      selectedModel,
      scale.xMin,
      scale.xMax,
      curvePointsCount,
    );

    const pathSegs: string[] = [];
    let isDrawing = false;

    for (const p of samples) {
      if (p.y < scale.yMin - 15 || p.y > scale.yMax + 15) {
        isDrawing = false;
        continue;
      }

      const dPos = mathToDesign(p.x, p.y, scale);
      if (!isDrawing) {
        pathSegs.push(`M ${dPos.x.toFixed(1)} ${dPos.y.toFixed(1)}`);
        isDrawing = true;
      } else {
        pathSegs.push(`L ${dPos.x.toFixed(1)} ${dPos.y.toFixed(1)}`);
      }
    }
    return pathSegs.join(" ");
  }, [currentFit, scale, selectedModel]);

  // 4. 处理拖拽散点（反向求参：自动切入自由探索在上层处理）
  const handlePointDrag = (
    id: string,
    newMathPos: { x: number; y: number },
  ) => {
    const updated = points.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          x: Number(newMathPos.x.toFixed(2)),
          y: Number(newMathPos.y.toFixed(2)),
        };
      }
      return p;
    });
    onPointsChange(updated);
  };

  // 样本中心点 (meanX, meanY) 的设计坐标
  const centerPos = mathToDesign(regResult.meanX, regResult.meanY, scale);
  const centerAxisX = mathToDesign(regResult.meanX, 0, scale);
  const centerAxisY = mathToDesign(0, regResult.meanY, scale);

  // 高考回归预报靶点 (targetX, targetY) 设计坐标与轴投影
  const targetY =
    currentFit?.isValid && targetX !== undefined
      ? currentFit.predict(targetX)
      : null;
  const isTargetValid =
    targetX !== undefined &&
    targetY !== null &&
    Number.isFinite(targetY) &&
    targetY >= scale.yMin - 10 &&
    targetY <= scale.yMax + 10;
  const targetPos = isTargetValid
    ? mathToDesign(targetX, targetY, scale)
    : null;
  const targetAxisX = isTargetValid ? mathToDesign(targetX, 0, scale) : null;
  const targetAxisY = isTargetValid ? mathToDesign(0, targetY, scale) : null;

  // 构建学术点标组数据 (散点 P₁~Pₙ 与 样本中心点 (x̄, ȳ) 及 预测靶点 (x₀, ŷ₀))
  const regressionLabels = [
    ...points.map((p, idx) => {
      const ptD = mathToDesign(p.x, p.y, scale);
      const sub = SUBSCRIPT_DIGITS[idx] ?? `${idx + 1}`;
      return {
        key: `pt-${p.id}`,
        x: ptD.x,
        y: ptD.y,
        text: `P${sub}`,
        color: MATH_COLORS.paramPrimary,
        fontSize: fontScale(11),
      };
    }),
    ...(selectedModel === "linear" && regResult.isValid
      ? [
          {
            key: "pt-center",
            x: centerPos.x,
            y: centerPos.y,
            text: "(x̄, ȳ)",
            color: MATH_COLORS.paramSecondary,
            fontSize: fontScale(12),
          },
        ]
      : []),
    ...(targetPos && isTargetValid && targetY !== null
      ? [
          {
            key: "pt-target",
            x: targetPos.x,
            y: targetPos.y,
            text: `(x₀, ŷ₀)=(${targetX}, ${targetY.toFixed(1)})`,
            color: MATH_COLORS.paramTertiary,
            fontSize: fontScale(11),
          },
        ]
      : []),
  ];

  return (
    <g className="paired-data-scene-regression">
      {/* 坐标轴与网格 */}
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 1. 绘制最小二乘几何“残差正方形面积” (Least Squares Residual Squares) */}
      <g opacity={stepSpotlight(2)}>
        {showResidualSquares &&
          currentFit?.isValid &&
          points.map((p) => {
            const yHat = currentFit.predict(p.x);
            const ptDesign = mathToDesign(p.x, p.y, scale);
            const hatDesign = mathToDesign(p.x, yHat, scale);
            const size = Math.abs(hatDesign.y - ptDesign.y);

            // 正方形在设计像素层向右延伸，面积在像素上严格正比于残差平方
            const sqX = ptDesign.x;
            const sqY = Math.min(ptDesign.y, hatDesign.y);

            return (
              <g key={`sq-${p.id}`} opacity={0.65}>
                <rect
                  x={sqX}
                  y={sqY}
                  width={size}
                  height={size}
                  fill={withAlpha(MATH_COLORS.paramTertiary, 0.2)}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.2}
                  strokeDasharray="2 2"
                  rx={2}
                />
              </g>
            );
          })}

        {/* 2. 绘制残差垂线 (散点 -> 拟合曲线对应点) */}
        {currentFit?.isValid &&
          points.map((p) => {
            const yHat = currentFit.predict(p.x);
            const ptDesign = mathToDesign(p.x, p.y, scale);
            const hatDesign = mathToDesign(p.x, yHat, scale);
            return (
              <g key={`res-${p.id}`}>
                <line
                  x1={ptDesign.x}
                  y1={ptDesign.y}
                  x2={hatDesign.x}
                  y2={hatDesign.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeDasharray="3 3"
                  strokeWidth={1.8}
                  opacity={0.85}
                />
                <circle
                  cx={hatDesign.x}
                  cy={hatDesign.y}
                  r={3}
                  fill={MATH_COLORS.tangentLine}
                />
              </g>
            );
          })}
      </g>

      {/* 3. 绘制拟合回归曲线/直线（离群点情景下同屏展示：含异常点虚线 vs 剔除异常点实线） */}
      {currentFit?.isValid && curvePath && (
        <path
          d={curvePath}
          stroke={
            cleanedLineSeg ? MATH_COLORS.degeneracy : MATH_COLORS.function
          }
          strokeWidth={cleanedLineSeg ? 2.2 : 3}
          strokeDasharray={cleanedLineSeg ? "6 4" : undefined}
          fill="none"
          opacity={cleanedLineSeg ? 0.8 : 1}
        />
      )}

      {cleanedLineSeg && (
        <g>
          <line
            x1={cleanedLineSeg.p1.x}
            y1={cleanedLineSeg.p1.y}
            x2={cleanedLineSeg.p2.x}
            y2={cleanedLineSeg.p2.y}
            stroke={MATH_COLORS.function}
            strokeWidth={3.2}
          />
          {/* 离群点警示环与双线对比浮标 */}
          {points.length > 0 &&
            (() => {
              const outPt = points[points.length - 1];
              const outDesign = mathToDesign(outPt.x, outPt.y, scale);
              return (
                <g>
                  <circle
                    cx={outDesign.x}
                    cy={outDesign.y}
                    r={13}
                    fill={withAlpha(MATH_COLORS.degeneracy, 0.14)}
                    stroke={MATH_COLORS.degeneracy}
                    strokeWidth={1.8}
                    strokeDasharray="3 2"
                  />
                  <rect
                    x={Math.min(600, Math.max(24, outDesign.x - 105))}
                    y={Math.min(580, outDesign.y + 16)}
                    width={210}
                    height={38}
                    rx={6}
                    fill={withAlpha(CANVAS_COLORS.white, 0.94)}
                    stroke={MATH_COLORS.degeneracy}
                    strokeWidth={1.2}
                  />
                  <text
                    x={Math.min(600, Math.max(24, outDesign.x - 105)) + 105}
                    y={Math.min(580, outDesign.y + 16) + 15}
                    textAnchor="middle"
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                    fill={MATH_COLORS.degeneracy}
                  >
                    虚线(含离群点): R²={regResult.rSquare.toFixed(3)}
                  </text>
                  <text
                    x={Math.min(600, Math.max(24, outDesign.x - 105)) + 105}
                    y={Math.min(580, outDesign.y + 16) + 31}
                    textAnchor="middle"
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                    fill={MATH_COLORS.function}
                  >
                    实线(剔除P
                    {SUBSCRIPT_DIGITS[points.length - 1] ?? points.length}后):
                    R²={cleanedLineSeg.cleaned.rSquare.toFixed(3)}
                  </text>
                </g>
              );
            })()}
        </g>
      )}

      {/* 4. 标记样本中心点 (meanX, meanY) - 仅线性模型下必过重心 */}
      {selectedModel === "linear" && regResult.isValid && (
        <g className="center-point-group" opacity={stepSpotlight(1)}>
          {/* 投影到 X 轴虚线 */}
          <line
            x1={centerPos.x}
            y1={centerPos.y}
            x2={centerAxisX.x}
            y2={centerAxisX.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeDasharray="4 4"
            strokeWidth={1.2}
          />
          {/* 投影到 Y 轴虚线 */}
          <line
            x1={centerPos.x}
            y1={centerPos.y}
            x2={centerAxisY.x}
            y2={centerAxisY.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeDasharray="4 4"
            strokeWidth={1.2}
          />
          {/* 样本中心点脉冲光晕 */}
          <circle
            cx={centerPos.x}
            cy={centerPos.y}
            r={9}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.25)}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
          />
          <circle
            cx={centerPos.x}
            cy={centerPos.y}
            r={3.8}
            fill={MATH_COLORS.paramSecondary}
          />
        </g>
      )}

      {/* 5. 高考回归预报靶点 (x₀, ŷ₀) 及其坐标轴投影 */}
      {targetPos && isTargetValid && targetAxisX && targetAxisY && (
        <g className="target-forecast-group" opacity={stepSpotlight(3)}>
          {/* 投影到 X 轴虚线 */}
          <line
            x1={targetPos.x}
            y1={targetPos.y}
            x2={targetAxisX.x}
            y2={targetAxisX.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeDasharray="3 3"
            strokeWidth={1.3}
          />
          {/* 投影到 Y 轴虚线 */}
          <line
            x1={targetPos.x}
            y1={targetPos.y}
            x2={targetAxisY.x}
            y2={targetAxisY.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeDasharray="3 3"
            strokeWidth={1.3}
          />
          {/* 靶点外圈脉冲指示光晕 */}
          <circle
            cx={targetPos.x}
            cy={targetPos.y}
            r={10}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.22)}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.4}
            strokeDasharray="2 2"
          />
          {/* 靶点核心实心点 */}
          <circle
            cx={targetPos.x}
            cy={targetPos.y}
            r={4.2}
            fill={MATH_COLORS.paramTertiary}
          />
        </g>
      )}

      {/* 5. 可拖拽散点 */}
      {points.map((p) => (
        <InteractivePoint
          key={p.id}
          cx={p.x}
          cy={p.y}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramPrimary}
          r={6.5}
          fontScale={fontScale}
          onDrag={(newPos) => handlePointDrag(p.id, newPos)}
        />
      ))}

      {/* 6. 统一智能防重叠学术标签层 */}
      <SceneLabelGroup items={regressionLabels} fontScale={fontScale} />

      {/* 7. 下方残差分析分布图 (Residual Plot Overlay - 置于左上角独立区域，避开右下角图例) */}
      {showResidualPlot &&
        currentFit?.isValid &&
        (() => {
          const xVals = points.map((p) => p.x);
          const minX = Math.min(...xVals);
          const maxX = Math.max(...xVals);
          const xSpan = maxX - minX > 1e-4 ? maxX - minX : 1;

          const residualsWithX = points.map((p) => ({
            x: p.x,
            e: p.y - currentFit.predict(p.x),
            id: p.id,
          }));
          const maxAbsE = Math.max(
            0.6,
            ...residualsWithX.map((r) => Math.abs(r.e)),
          );
          const eScaleY = 32 / maxAbsE;

          return (
            <g transform="translate(24, 55)">
              <rect
                x={0}
                y={0}
                width={300}
                height={140}
                rx={8}
                fill={CANVAS_COLORS.white}
                fillOpacity={0.96}
                stroke={CANVAS_COLORS.axis}
                strokeWidth={1}
                filter="drop-shadow(0 2px 6px rgba(0,0,0,0.06))"
              />
              <text
                x={12}
                y={18}
                fontSize={fontScale(10.5)}
                fontWeight="bold"
                fill={CANVAS_COLORS.labelText}
              >
                【残差分布检验图 (x_i, e_i)】∑e_i ≈ 0
              </text>
              {/* e = 0 零残差基准线 */}
              <line
                x1={18}
                y1={68}
                x2={275}
                y2={68}
                stroke={CANVAS_COLORS.axis}
                strokeWidth={1.2}
              />
              <text
                x={278}
                y={71}
                fontSize={fontScale(8.5)}
                fill={CANVAS_COLORS.labelTextLight}
              >
                e=0
              </text>
              {/* 上下对称残差带状参考线 */}
              <line
                x1={18}
                y1={68 - maxAbsE * 0.7 * eScaleY}
                x2={275}
                y2={68 - maxAbsE * 0.7 * eScaleY}
                stroke={MATH_COLORS.paramTertiary}
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.6}
              />
              <text
                x={278}
                y={68 - maxAbsE * 0.7 * eScaleY + 3}
                fontSize={fontScale(8)}
                fill={MATH_COLORS.paramTertiary}
              >
                +{(maxAbsE * 0.7).toFixed(1)}
              </text>
              <line
                x1={18}
                y1={68 + maxAbsE * 0.7 * eScaleY}
                x2={275}
                y2={68 + maxAbsE * 0.7 * eScaleY}
                stroke={MATH_COLORS.paramTertiary}
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.6}
              />
              <text
                x={278}
                y={68 + maxAbsE * 0.7 * eScaleY + 3}
                fontSize={fontScale(8)}
                fill={MATH_COLORS.paramTertiary}
              >
                -{(maxAbsE * 0.7).toFixed(1)}
              </text>
              {/* 残差点分布 */}
              {residualsWithX.map((r) => {
                const px = 26 + ((r.x - minX) / xSpan) * 235;
                const py = 68 - r.e * eScaleY;
                const clampedPy = Math.max(22, Math.min(125, py));
                return (
                  <g key={`res-plot-${r.id}`}>
                    <line
                      x1={px}
                      y1={68}
                      x2={px}
                      y2={clampedPy}
                      stroke={MATH_COLORS.tangentLine}
                      strokeDasharray="2 2"
                      strokeWidth={1}
                    />
                    <circle
                      cx={px}
                      cy={clampedPy}
                      r={3.2}
                      fill={MATH_COLORS.paramPrimary}
                    />
                  </g>
                );
              })}
            </g>
          );
        })()}

      {/* 轴名称标注 (自适应贴合坐标轴箭头末端，绝不溢出) */}
      {(() => {
        const xAxisEnd = mathToDesign(scale.xMax, 0, scale);
        const yAxisTop = mathToDesign(0, scale.yMax, scale);
        return (
          <>
            <text
              x={Math.min(810, xAxisEnd.x - 10)}
              y={Math.min(620, Math.max(30, xAxisEnd.y - 10))}
              textAnchor="end"
              fontSize={fontScale(11)}
              fill={CANVAS_COLORS.labelText}
              fontWeight="bold"
            >
              {presetXName}
            </text>
            <text
              x={Math.max(15, Math.min(780, yAxisTop.x + 12))}
              y={Math.max(30, yAxisTop.y + 12)}
              textAnchor="start"
              fontSize={fontScale(11)}
              fill={CANVAS_COLORS.labelText}
              fontWeight="bold"
            >
              {presetYName}
            </text>
          </>
        );
      })()}

      {/* 分步作答聚焦围栏（与左屏 StepNavigator、右屏 MathPanel 三方同源） */}
      {activeStep !== undefined &&
        (() => {
          const ptDesigns = points.map((p) => mathToDesign(p.x, p.y, scale));
          const minPx =
            ptDesigns.length > 0
              ? Math.min(...ptDesigns.map((d) => d.x))
              : centerPos.x - 100;
          const maxPx =
            ptDesigns.length > 0
              ? Math.max(...ptDesigns.map((d) => d.x))
              : centerPos.x + 100;
          const minPy =
            ptDesigns.length > 0
              ? Math.min(...ptDesigns.map((d) => d.y))
              : centerPos.y - 80;
          const maxPy =
            ptDesigns.length > 0
              ? Math.max(...ptDesigns.map((d) => d.y))
              : centerPos.y + 80;

          const box =
            activeStep === 1
              ? {
                  x: centerPos.x - 75,
                  y: centerPos.y - 55,
                  width: 150,
                  height: 110,
                }
              : activeStep === 2
                ? {
                    x: minPx - 32,
                    y: minPy - 32,
                    width: Math.max(120, maxPx - minPx + 64),
                    height: Math.max(100, maxPy - minPy + 64),
                  }
                : targetPos
                  ? {
                      x: targetPos.x - 85,
                      y: targetPos.y - 55,
                      width: 170,
                      height: 110,
                    }
                  : {
                      x: centerPos.x - 75,
                      y: centerPos.y - 55,
                      width: 150,
                      height: 110,
                    };

          const stepInfo =
            REGRESSION_ANSWER_STEPS[
              Math.min(
                REGRESSION_ANSWER_STEPS.length - 1,
                Math.max(0, activeStep - 1),
              )
            ];
          const chipLabel = `第 ${stepInfo.step} / ${REGRESSION_ANSWER_STEPS.length} 步 · ${stepInfo.title}`;
          const chipW = Math.min(300, Math.max(180, chipLabel.length * 11));
          const chipX = Math.max(16, Math.min(820 - chipW, box.x + 8));
          const chipY = Math.max(46, box.y - 12);

          return (
            <g pointerEvents="none">
              <rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                rx={12}
                fill="none"
                stroke={MATH_COLORS.answerStepFrame}
                strokeWidth={2.2}
                strokeDasharray="7 4"
              />
              <rect
                x={chipX}
                y={chipY}
                width={chipW}
                height={22}
                rx={6}
                fill={MATH_COLORS.answerStepFrame}
              />
              <text
                x={chipX + chipW / 2}
                y={chipY + 15}
                textAnchor="middle"
                fontSize={fontScale(10)}
                fontWeight="bold"
                fill={CANVAS_COLORS.white}
              >
                {chipLabel}
              </text>
            </g>
          );
        })()}
    </g>
  );
};
