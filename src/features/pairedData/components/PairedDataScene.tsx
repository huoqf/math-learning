import React, { useMemo } from "react";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  Point2D,
  RegressionModelType,
  calculateLinearRegression,
  calculateIndependenceTest,
  fitAllRegressionModels,
} from "@/math/pairedData";

interface PairedDataSceneProps {
  studyMode: "regression" | "independence";
  selectedModel?: RegressionModelType;
  showResidualSquares?: boolean;
  showResidualPlot?: boolean;
  points: Point2D[];
  onPointsChange: (newPoints: Point2D[]) => void;
  freqA: number;
  freqB: number;
  freqC: number;
  freqD: number;
  presetXName: string;
  presetYName: string;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  xStep?: number;
  yStep?: number;
}

export const PairedDataScene: React.FC<PairedDataSceneProps> = ({
  studyMode,
  selectedModel = "linear",
  showResidualSquares = true,
  showResidualPlot = false,
  points,
  onPointsChange,
  freqA,
  freqB,
  freqC,
  freqD,
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
    return modelFits.find((m) => m.type === selectedModel) ?? modelFits[0];
  }, [modelFits, selectedModel]);

  // 3. 独立性检验计算
  const indResult = useMemo(() => {
    return calculateIndependenceTest(freqA, freqB, freqC, freqD);
  }, [freqA, freqB, freqC, freqD]);

  // 4. 生成平滑拟合曲线路径 (动态响应视口数学范围 scale.xMin ~ scale.xMax，顶层 Hook)
  const curvePointsCount = 140;
  const curvePath = useMemo(() => {
    if (studyMode !== "regression" || !currentFit || !currentFit.isValid)
      return "";
    const pathSegs: string[] = [];
    let isDrawing = false;

    // 自适应安全采样区间
    const startX =
      selectedModel === "logarithmic" || selectedModel === "power"
        ? Math.max(0.02, scale.xMin)
        : scale.xMin;
    const endX = scale.xMax;
    const stepX = (endX - startX) / curvePointsCount;

    for (let i = 0; i <= curvePointsCount; i++) {
      const mx = startX + i * stepX;
      if (selectedModel === "logarithmic" || selectedModel === "power") {
        if (mx <= 0.01) {
          isDrawing = false;
          continue;
        }
      }
      if (selectedModel === "inverse" && Math.abs(mx) < 0.05) {
        isDrawing = false;
        continue;
      }

      const my = currentFit.predict(mx);
      // 过滤非数值及大幅超出视口上下界的无效点
      if (
        isNaN(my) ||
        !isFinite(my) ||
        my < scale.yMin - 15 ||
        my > scale.yMax + 15
      ) {
        isDrawing = false;
        continue;
      }

      const dPos = mathToDesign(mx, my, scale);
      if (!isDrawing) {
        pathSegs.push(`M ${dPos.x.toFixed(1)} ${dPos.y.toFixed(1)}`);
        isDrawing = true;
      } else {
        pathSegs.push(`L ${dPos.x.toFixed(1)} ${dPos.y.toFixed(1)}`);
      }
    }
    return pathSegs.join(" ");
  }, [studyMode, currentFit, scale, selectedModel]);

  // 处理拖拽散点
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

  // 如果是回归分析模式
  if (studyMode === "regression") {
    // 样本中心点 (meanX, meanY) 的设计坐标
    const centerPos = mathToDesign(regResult.meanX, regResult.meanY, scale);
    const centerAxisX = mathToDesign(regResult.meanX, 0, scale);
    const centerAxisY = mathToDesign(0, regResult.meanY, scale);

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
              r={10}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.25)}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1.5}
            />
            <circle
              cx={centerPos.x}
              cy={centerPos.y}
              r={4}
              fill={MATH_COLORS.paramSecondary}
            />
            {/* 中心点文本标签 (向上偏移避让点) */}
            <rect
              x={centerPos.x + 8}
              y={centerPos.y - 28}
              width={140}
              height={22}
              rx={4}
              fill={CANVAS_COLORS.white}
              fillOpacity={0.9}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1}
            />
            <text
              x={centerPos.x + 14}
              y={centerPos.y - 13}
              fill={MATH_COLORS.paramSecondary}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              重心 (x̄={regResult.meanX.toFixed(1)}, ȳ=
              {regResult.meanY.toFixed(1)})
            </text>
          </g>
        )}

        {/* 5. 可拖拽散点 (带有独立半透明背景标签，防止与网格重叠) */}
        {points.map((p, idx) => {
          const ptD = mathToDesign(p.x, p.y, scale);
          return (
            <g key={p.id}>
              <InteractivePoint
                cx={p.x}
                cy={p.y}
                scale={scale}
                vp={vp}
                color={MATH_COLORS.paramPrimary}
                r={7}
                fontScale={fontScale}
                onDrag={(newPos) => handlePointDrag(p.id, newPos)}
              />
              <rect
                x={ptD.x + 8}
                y={ptD.y + 4}
                width={70}
                height={18}
                rx={3}
                fill={CANVAS_COLORS.white}
                fillOpacity={0.85}
                stroke={CANVAS_COLORS.axis}
                strokeWidth={0.8}
              />
              <text
                x={ptD.x + 12}
                y={ptD.y + 17}
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(10)}
                fontWeight="500"
              >
                P{idx + 1}({p.x.toFixed(1)}, {p.y.toFixed(1)})
              </text>
            </g>
          );
        })}

        {/* 6. 浮动图例看板 (置于左下角安全区域，避开顶部公式与密集数据) */}
        <g transform="translate(30, 520)">
          <rect
            x={0}
            y={0}
            width={280}
            height={showResidualSquares ? 84 : 62}
            rx={8}
            fill={CANVAS_COLORS.white}
            fillOpacity={0.94}
            stroke={CANVAS_COLORS.axis}
            strokeWidth={1}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))"
          />
          <line
            x1={14}
            y1={18}
            x2={40}
            y2={18}
            stroke={MATH_COLORS.function}
            strokeWidth={2.5}
          />
          <text
            x={48}
            y={22}
            fill={MATH_COLORS.function}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            {currentFit?.name ?? "拟合曲线"}: R²=
            {(currentFit?.rSquare ?? 0).toFixed(4)}
          </text>
          <line
            x1={14}
            y1={38}
            x2={40}
            y2={38}
            stroke={MATH_COLORS.tangentLine}
            strokeDasharray="3 3"
            strokeWidth={1.5}
          />
          <text
            x={48}
            y={42}
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(10)}
          >
            残差 e_i = y_i - ŷ_i (SSE={(currentFit?.sse ?? 0).toFixed(2)})
          </text>
          {showResidualSquares && (
            <>
              <rect
                x={16}
                y={54}
                width={14}
                height={14}
                fill={withAlpha(MATH_COLORS.paramTertiary, 0.25)}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1}
                strokeDasharray="2 2"
                rx={2}
              />
              <text
                x={48}
                y={66}
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(10)}
                fontWeight="bold"
              >
                残差正方形面积和 = SSE (最小二乘)
              </text>
            </>
          )}
        </g>

        {/* 7. 下方残差分析分布图 (Residual Plot Overlay - 置于右下角独立区域) */}
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
            const eScaleY = 36 / maxAbsE;

            return (
              <g transform="translate(480, 455)">
                <rect
                  x={0}
                  y={0}
                  width={330}
                  height={155}
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
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  fill={CANVAS_COLORS.labelText}
                >
                  【残差分布图 (x_i, e_i)】∑e_i ≈ 0
                </text>
                {/* e = 0 零残差基准线 */}
                <line
                  x1={20}
                  y1={75}
                  x2={305}
                  y2={75}
                  stroke={CANVAS_COLORS.axis}
                  strokeWidth={1.2}
                />
                <text
                  x={308}
                  y={78}
                  fontSize={fontScale(9)}
                  fill={CANVAS_COLORS.labelTextLight}
                >
                  e=0
                </text>
                {/* 上下对称残差带状参考线 */}
                <line
                  x1={20}
                  y1={75 - maxAbsE * 0.7 * eScaleY}
                  x2={305}
                  y2={75 - maxAbsE * 0.7 * eScaleY}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  opacity={0.6}
                />
                <text
                  x={308}
                  y={75 - maxAbsE * 0.7 * eScaleY + 3}
                  fontSize={fontScale(8)}
                  fill={MATH_COLORS.paramTertiary}
                >
                  +{(maxAbsE * 0.7).toFixed(1)}
                </text>
                <line
                  x1={20}
                  y1={75 + maxAbsE * 0.7 * eScaleY}
                  x2={305}
                  y2={75 + maxAbsE * 0.7 * eScaleY}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  opacity={0.6}
                />
                <text
                  x={308}
                  y={75 + maxAbsE * 0.7 * eScaleY + 3}
                  fontSize={fontScale(8)}
                  fill={MATH_COLORS.paramTertiary}
                >
                  -{(maxAbsE * 0.7).toFixed(1)}
                </text>
                {/* 残差点分布 */}
                {residualsWithX.map((r) => {
                  const px = 30 + ((r.x - minX) / xSpan) * 260;
                  const py = 75 - r.e * eScaleY;
                  const clampedPy = Math.max(25, Math.min(135, py));
                  return (
                    <g key={`res-plot-${r.id}`}>
                      <line
                        x1={px}
                        y1={75}
                        x2={px}
                        y2={clampedPy}
                        stroke={MATH_COLORS.tangentLine}
                        strokeDasharray="2 2"
                        strokeWidth={1}
                      />
                      <circle
                        cx={px}
                        cy={clampedPy}
                        r={3.5}
                        fill={MATH_COLORS.paramPrimary}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })()}

        {/* 轴名称标注 (避让坐标系边缘) */}
        <text
          x={760}
          y={635}
          fontSize={fontScale(11)}
          fill={CANVAS_COLORS.labelText}
          fontWeight="bold"
        >
          {presetXName}
        </text>
        <text
          x={25}
          y={40}
          fontSize={fontScale(11)}
          fill={CANVAS_COLORS.labelText}
          fontWeight="bold"
        >
          {presetYName}
        </text>
      </g>
    );
  }

  // 独立性检验可视化场景
  const row1Total = freqA + freqB;
  const row2Total = freqC + freqD;

  const ratioA_B = row1Total > 0 ? freqA / row1Total : 0;
  const ratioA_NotB = row1Total > 0 ? freqB / row1Total : 0;
  const ratioNotA_B = row2Total > 0 ? freqC / row2Total : 0;
  const ratioNotA_NotB = row2Total > 0 ? freqD / row2Total : 0;

  // 绘制卡方数轴区域
  const axisY = 480;
  const axisStartX = 100;
  const axisEndX = 740;
  const axisWidth = axisEndX - axisStartX;
  const maxChi = 15; // 坐标轴最大刻度卡方值

  const getChiX = (val: number) => {
    const clamped = Math.min(maxChi, Math.max(0, val));
    return axisStartX + (clamped / maxChi) * axisWidth;
  };

  const currChiX = getChiX(indResult.chiSquare);

  // 下移偏移量，为顶部公式留出空间
  const offsetDown = 50;

  return (
    <g
      className="paired-data-scene-independence"
      transform={`translate(0, ${offsetDown})`}
    >
      {/* 背景卡片 */}
      <rect
        x={20}
        y={20}
        width={800}
        height={580}
        rx={12}
        fill={CANVAS_COLORS.gridSubtle}
        stroke={CANVAS_COLORS.grid}
        strokeWidth={1}
      />

      {/* 标题 */}
      <text
        x={400}
        y={50}
        textAnchor="middle"
        fontSize={fontScale(18)}
        fontWeight="bold"
        fill={CANVAS_COLORS.labelText}
      >
        2 × 2 列联表条件频率分布与卡方检验
      </text>

      {/* 1. 上半部分：2x2 列联表条件频率对比图 (堆叠百分比柱状图) */}
      <g transform="translate(140, 90)">
        <text
          x={0}
          y={-10}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【分类条件频率对比】
        </text>

        {/* 柱状图 1: 组 A (如：新药组/男生) */}
        <g transform="translate(60, 20)">
          <text
            x={60}
            y={-10}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill={CANVAS_COLORS.labelTextLight}
          >
            类 A 样本 (共 {row1Total} 人)
          </text>
          {/* B 部分 */}
          <rect
            x={0}
            y={0}
            width={120}
            height={200 * ratioA_B}
            fill={MATH_COLORS.paramPrimary}
            rx={4}
            opacity={0.85}
          />
          {ratioA_B > 0.08 && (
            <text
              x={60}
              y={100 * ratioA_B + 5}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              B ({freqA}人, {(ratioA_B * 100).toFixed(1)}%)
            </text>
          )}
          {/* 非 B 部分 */}
          <rect
            x={0}
            y={200 * ratioA_B}
            width={120}
            height={200 * ratioA_NotB}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            rx={4}
          />
          {ratioA_NotB > 0.08 && (
            <text
              x={60}
              y={200 * ratioA_B + 100 * ratioA_NotB + 5}
              textAnchor="middle"
              fill={CANVAS_COLORS.labelText}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              非B ({freqB}人, {(ratioA_NotB * 100).toFixed(1)}%)
            </text>
          )}
        </g>

        {/* 柱状图 2: 组 非 A (如：对照组/女生) */}
        <g transform="translate(320, 20)">
          <text
            x={60}
            y={-10}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill={CANVAS_COLORS.labelTextLight}
          >
            类 非A 样本 (共 {row2Total} 人)
          </text>
          {/* B 部分 */}
          <rect
            x={0}
            y={0}
            width={120}
            height={200 * ratioNotA_B}
            fill={MATH_COLORS.paramSecondary}
            rx={4}
            opacity={0.85}
          />
          {ratioNotA_B > 0.08 && (
            <text
              x={60}
              y={100 * ratioNotA_B + 5}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              B ({freqC}人, {(ratioNotA_B * 100).toFixed(1)}%)
            </text>
          )}
          {/* 非 B 部分 */}
          <rect
            x={0}
            y={200 * ratioNotA_B}
            width={120}
            height={200 * ratioNotA_NotB}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
            rx={4}
          />
          {ratioNotA_NotB > 0.08 && (
            <text
              x={60}
              y={200 * ratioNotA_B + 100 * ratioNotA_NotB + 5}
              textAnchor="middle"
              fill={CANVAS_COLORS.labelText}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              非B ({freqD}人, {(ratioNotA_NotB * 100).toFixed(1)}%)
            </text>
          )}
        </g>
      </g>

      {/* 2. 下半部分：卡方检验数轴标尺与决策区域 */}
      <g transform="translate(0, 0)">
        <text
          x={axisStartX}
          y={axisY - 45}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={CANVAS_COLORS.labelText}
        >
          【χ² 卡方检验统计量数轴与高考临界值标尺】
        </text>

        {/* 拒绝域背景区间阴影 (>= 3.841) */}
        <rect
          x={getChiX(3.841)}
          y={axisY - 20}
          width={axisEndX - getChiX(3.841)}
          height={40}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.15)}
          rx={4}
        />
        <text
          x={axisEndX - 10}
          y={axisY - 25}
          textAnchor="end"
          fill={MATH_COLORS.paramTertiary}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          拒绝 H₀ 区域 (95% 把握以上关联)
        </text>

        {/* 主数轴线 */}
        <line
          x1={axisStartX}
          y1={axisY}
          x2={axisEndX}
          y2={axisY}
          stroke={CANVAS_COLORS.labelTextLight}
          strokeWidth={3}
        />

        {/* 关键卡方临界值刻度标尺 */}
        {[
          { val: 0, label: "0" },
          { val: 2.706, label: "2.706 (90%)" },
          { val: 3.841, label: "3.841 (95%)" },
          { val: 6.635, label: "6.635 (99%)" },
          { val: 10.828, label: "10.828 (99.9%)" },
        ].map((tick) => {
          const tx = getChiX(tick.val);
          return (
            <g key={`tick-${tick.val}`}>
              <line
                x1={tx}
                y1={axisY - 8}
                x2={tx}
                y2={axisY + 8}
                stroke={CANVAS_COLORS.labelText}
                strokeWidth={2}
              />
              <text
                x={tx}
                y={axisY + 24}
                textAnchor="middle"
                fontSize={fontScale(11)}
                fontWeight={
                  tick.val === 3.841 || tick.val === 6.635 ? "bold" : "normal"
                }
                fill={
                  tick.val === 3.841 || tick.val === 6.635
                    ? MATH_COLORS.paramPrimary
                    : CANVAS_COLORS.labelTextLight
                }
              >
                {tick.label}
              </text>
            </g>
          );
        })}

        {/* 动态计算出的当前 χ² 观测值指针 */}
        <g transform={`translate(${currChiX}, ${axisY})`}>
          <polygon
            points="0,-12 -8,-24 8,-24"
            fill={MATH_COLORS.paramPrimary}
          />
          <line
            x1={0}
            y1={-24}
            x2={0}
            y2={-45}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="2 2"
          />
          <rect
            x={-60}
            y={-70}
            width={120}
            height={24}
            rx={12}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={0}
            y={-54}
            textAnchor="middle"
            fill={CANVAS_COLORS.white}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            χ² = {indResult.chiSquare.toFixed(3)}
          </text>
        </g>
      </g>
    </g>
  );
};
