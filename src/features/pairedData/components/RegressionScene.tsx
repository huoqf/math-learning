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
  fitAllRegressionModels,
  selectCurrentFit,
  sampleRegressionCurvePoints,
} from "@/math/pairedData";

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
  xStep?: number;
  yStep?: number;
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
  xStep = 1,
  yStep = 1,
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

  // 构建学术点标组数据 (散点 P₁~Pₙ 与 样本中心点 (x̄, ȳ))
  const subscriptDigits = ["₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₁₀"];
  const regressionLabels = [
    ...points.map((p, idx) => {
      const ptD = mathToDesign(p.x, p.y, scale);
      const sub = subscriptDigits[idx] ?? `${idx + 1}`;
      return {
        key: `pt-${p.id}`,
        x: ptD.x,
        y: ptD.y,
        text: `P${sub}`,
        color: MATH_COLORS.paramPrimary,
        fontSize: fontScale(11),
      };
    }),
    ...(regResult.isValid
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

      {/* 3. 绘制拟合回归曲线/直线 */}
      {currentFit?.isValid && curvePath && (
        <path
          d={curvePath}
          stroke={MATH_COLORS.function}
          strokeWidth={3}
          fill="none"
        />
      )}

      {/* 4. 标记样本中心点 (meanX, meanY) - 线性模型下必过重心 */}
      {regResult.isValid && (
        <g className="center-point-group">
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
    </g>
  );
};
