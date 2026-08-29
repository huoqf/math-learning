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
  calculateIndependenceTest,
  fitAllRegressionModels,
  getChiSquare1Pdf,
  selectCurrentFit,
  sampleRegressionCurvePoints,
  sampleChiSquareCurvePoints,
  mapChiValueToPixel,
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
  labelA?: string;
  labelNotA?: string;
  labelB?: string;
  labelNotB?: string;
  scaleMultiplier?: number;
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
  labelA = "类 A",
  labelNotA = "类 非A",
  labelB = "属性 B",
  labelNotB = "属性 非B",
  scaleMultiplier = 1,
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

  // 3. 独立性检验计算（考虑倍增因子）
  const mult = Math.max(1, Math.round(scaleMultiplier));
  const effectiveA = freqA * mult;
  const effectiveB = freqB * mult;
  const effectiveC = freqC * mult;
  const effectiveD = freqD * mult;

  const indResult = useMemo(() => {
    return calculateIndependenceTest(
      effectiveA,
      effectiveB,
      effectiveC,
      effectiveD,
    );
  }, [effectiveA, effectiveB, effectiveC, effectiveD]);

  // 4. 生成平滑拟合曲线路径 (动态响应视口数学范围 scale.xMin ~ scale.xMax，顶层 Hook)
  const curvePointsCount = 140;
  const curvePath = useMemo(() => {
    if (studyMode !== "regression" || !currentFit || !currentFit.isValid)
      return "";
    // 数学空间采样（含不连续点与 NaN/Infinity 剔除，纯数学层负责）
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
      // 过滤大幅超出视口上下界的无效点，并在视口中裁剪投影
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
  }, [studyMode, currentFit, scale, selectedModel]);

  // 5. 下半部分卡方分布与数轴几何参数与路径生成 (顶层 Hook)
  const chiPlotBaseY = 540;
  const chiPlotHeight = 160;
  const chiStartX = 75;
  const chiEndX = 765;
  const chiPlotWidth = chiEndX - chiStartX;
  const maxChi = 15; // 坐标轴最大刻度卡方值

  const getChiX = (val: number) =>
    mapChiValueToPixel(val, maxChi, chiStartX, chiPlotWidth);

  // 生成 ChiSquare(df=1) 平滑概率密度曲线路径 (pdf 放大至 85 像素高度)
  const chiCurvePath = useMemo(() => {
    if (studyMode !== "independence") return "";
    const segments: string[] = [];
    const points = sampleChiSquareCurvePoints(0.08, maxChi, 90);
    points.forEach((p, i) => {
      const px = mapChiValueToPixel(p.chi, maxChi, chiStartX, chiPlotWidth);
      const py = chiPlotBaseY - Math.min(chiPlotHeight, p.pdf * 85);
      if (i === 0) {
        segments.push(`M ${px.toFixed(1)} ${py.toFixed(1)}`);
      } else {
        segments.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
      }
    });
    return segments.join(" ");
  }, [studyMode, chiPlotWidth]);

  // 生成任意区间 [startChi, endChi] 在卡方曲线下方的封闭阴影路径辅助函数
  const generateChiShadePath = (
    startChi: number,
    endChi: number,
    samplesCount = 30,
  ) => {
    const sX = mapChiValueToPixel(startChi, maxChi, chiStartX, chiPlotWidth);
    const eX = mapChiValueToPixel(endChi, maxChi, chiStartX, chiPlotWidth);
    const points = sampleChiSquareCurvePoints(startChi, endChi, samplesCount);
    const segs: string[] = [`M ${sX.toFixed(1)} ${chiPlotBaseY}`];
    for (const p of points) {
      const px = mapChiValueToPixel(p.chi, maxChi, chiStartX, chiPlotWidth);
      const py = chiPlotBaseY - Math.min(chiPlotHeight, p.pdf * 85);
      segs.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    segs.push(`L ${eX.toFixed(1)} ${chiPlotBaseY} Z`);
    return segs.join(" ");
  };

  // 多级置信区间阴影路径 (接受域 / 95%拒绝域 / 99%拒绝域 / 99.9%极显著拒绝域)
  const acceptAreaPath = useMemo(() => {
    if (studyMode !== "independence") return "";
    return generateChiShadePath(0.08, 3.841, 40);
  }, [studyMode, chiPlotWidth]);

  const p95AreaPath = useMemo(() => {
    if (studyMode !== "independence") return "";
    return generateChiShadePath(3.841, 6.635, 25);
  }, [studyMode, chiPlotWidth]);

  const p99AreaPath = useMemo(() => {
    if (studyMode !== "independence") return "";
    return generateChiShadePath(6.635, 10.828, 25);
  }, [studyMode, chiPlotWidth]);

  const p999AreaPath = useMemo(() => {
    if (studyMode !== "independence") return "";
    return generateChiShadePath(10.828, maxChi, 25);
  }, [studyMode, chiPlotWidth]);

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
  }

  // 独立性检验可视化场景
  const row1Total = indResult.row1;
  const row2Total = indResult.row2;
  const col1Total = indResult.col1;
  const col2Total = indResult.col2;
  const totalN = indResult.n;

  const ratioA_B = row1Total > 0 ? effectiveA / row1Total : 0;
  const ratioA_NotB = row1Total > 0 ? effectiveB / row1Total : 0;
  const ratioNotA_B = row2Total > 0 ? effectiveC / row2Total : 0;
  const ratioNotA_NotB = row2Total > 0 ? effectiveD / row2Total : 0;
  const deltaP = Math.abs(ratioA_B - ratioNotA_B);

  // 下半部分卡方分布与数轴几何参数
  const chiAxisY = 535;
  const isChiOverflow = indResult.chiSquare > maxChi;
  const currChiX = getChiX(indResult.chiSquare);
  // 浮动标牌水平中心安全钳位 (卡片宽 210px，半宽 105px)
  const cardCenterX = isChiOverflow
    ? chiEndX - 110
    : Math.max(chiStartX + 105, Math.min(chiEndX - 105, currChiX));

  const minExpected = Math.min(
    indResult.expected.eA,
    indResult.expected.eB,
    indResult.expected.eC,
    indResult.expected.eD,
  );
  const isLargeSampleValid = totalN >= 40 && minExpected >= 5;

  return (
    <g className="paired-data-scene-independence" transform="translate(0, 0)">
      {/* 背景主卡片 */}
      <rect
        x={12}
        y={8}
        width={816}
        height={634}
        rx={12}
        fill={CANVAS_COLORS.gridSubtle}
        stroke={CANVAS_COLORS.grid}
        strokeWidth={1}
      />

      {/* 顶部主标题与核心代入计算公式胶囊栏 */}
      <g transform="translate(0, 24)">
        <text
          x={25}
          y={14}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={CANVAS_COLORS.labelText}
        >
          2 × 2 列联表独立性检验实验室
        </text>
        <text
          x={240}
          y={14}
          fontSize={fontScale(9.5)}
          fill={CANVAS_COLORS.labelTextLight}
        >
          (人教A版选择性必修三 · 统计推断)
        </text>

        {/* 顶部右侧代入公式胶囊 */}
        <g transform="translate(420, -6)">
          <rect
            x={0}
            y={0}
            width={395}
            height={28}
            rx={6}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
            filter="drop-shadow(0 1px 3px rgba(0,0,0,0.04))"
          />
          <text
            x={197}
            y={18}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            χ² = n(ad - bc)² / [(a+b)(c+d)(a+c)(b+d)] ={" "}
            {indResult.chiSquare.toFixed(3)}
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 1：左上区 —— 2×2 列联表四格矩阵 (四格表 + 边际合计 + 期望频数 E) */}
      {/* ========================================================================= */}
      <g transform="translate(25, 50)">
        <text
          x={4}
          y={11}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【2 × 2 列联表 (观测频数 O 与 理论期望频数 E)】
        </text>

        {/* 表格外框卡片 */}
        <g transform="translate(0, 18)">
          <rect
            x={0}
            y={0}
            width={385}
            height={148}
            rx={8}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 表头横纵分割线 */}
          <line
            x1={0}
            y1={28}
            x2={385}
            y2={28}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={68}
            x2={385}
            y2={68}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={108}
            x2={385}
            y2={108}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          <line
            x1={96}
            y1={0}
            x2={96}
            y2={148}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={192}
            y1={0}
            x2={192}
            y2={148}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={288}
            y1={0}
            x2={288}
            y2={148}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 列表头 */}
          <text
            x={48}
            y={18}
            textAnchor="middle"
            fontSize={fontScale(9.5)}
            fill={CANVAS_COLORS.labelTextLight}
            fontWeight="bold"
          >
            分类变量 X \ Y
          </text>
          <text
            x={144}
            y={18}
            textAnchor="middle"
            fontSize={labelB.length > 4 ? fontScale(9.5) : fontScale(10.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            {labelB}
          </text>
          <text
            x={240}
            y={18}
            textAnchor="middle"
            fontSize={labelNotB.length > 4 ? fontScale(9.5) : fontScale(10.5)}
            fill={CANVAS_COLORS.labelTextLight}
            fontWeight="bold"
          >
            {labelNotB}
          </text>
          <text
            x={336}
            y={18}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            行合计
          </text>

          {/* 行 1: labelA */}
          <text
            x={48}
            y={52}
            textAnchor="middle"
            fontSize={labelA.length > 4 ? fontScale(9) : fontScale(10.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            {labelA}
          </text>

          {/* 格 1 (a) */}
          <rect
            x={97}
            y={29}
            width={94}
            height={38}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          />
          <text
            x={144}
            y={46}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            a = {effectiveA}
          </text>
          <text
            x={144}
            y={61}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioA_B * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eA.toFixed(1)}
          </text>

          {/* 格 2 (b) */}
          <rect
            x={193}
            y={29}
            width={94}
            height={38}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.05)}
          />
          <text
            x={240}
            y={46}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            b = {effectiveB}
          </text>
          <text
            x={240}
            y={61}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioA_NotB * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eB.toFixed(1)}
          </text>

          {/* 行 1 合计 */}
          <text
            x={336}
            y={53}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {row1Total}
          </text>

          {/* 行 2: labelNotA */}
          <text
            x={48}
            y={92}
            textAnchor="middle"
            fontSize={labelNotA.length > 4 ? fontScale(9) : fontScale(10.5)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            {labelNotA}
          </text>

          {/* 格 3 (c) */}
          <rect
            x={97}
            y={69}
            width={94}
            height={38}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.06)}
          />
          <text
            x={144}
            y={86}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={MATH_COLORS.paramTertiary}
            fontWeight="bold"
          >
            c = {effectiveC}
          </text>
          <text
            x={144}
            y={101}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioNotA_B * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eC.toFixed(1)}
          </text>

          {/* 格 4 (d) */}
          <rect
            x={193}
            y={69}
            width={94}
            height={38}
            fill={withAlpha(CANVAS_COLORS.labelTextLight, 0.06)}
          />
          <text
            x={240}
            y={86}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            d = {effectiveD}
          </text>
          <text
            x={240}
            y={101}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioNotA_NotB * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eD.toFixed(1)}
          </text>

          {/* 行 2 合计 */}
          <text
            x={336}
            y={93}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {row2Total}
          </text>

          {/* 列合计行 */}
          <text
            x={48}
            y={131}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            列合计
          </text>
          <text
            x={144}
            y={131}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {col1Total}
          </text>
          <text
            x={240}
            y={131}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {col2Total}
          </text>

          {/* 总样本数 n */}
          <rect
            x={289}
            y={109}
            width={95}
            height={38}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
            rx={4}
          />
          <text
            x={336}
            y={124}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={MATH_COLORS.paramPrimary}
          >
            总样本量
          </text>
          <text
            x={336}
            y={139}
            textAnchor="middle"
            fontSize={fontScale(12.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            n = {totalN}
          </text>
        </g>

        {/* 底部对角乘积对比与大样本判定条 */}
        <g transform="translate(0, 172)">
          <rect
            x={0}
            y={0}
            width={385}
            height={24}
            rx={5}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <text
            x={10}
            y={16}
            fontSize={fontScale(9)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            交叉积: ad = {effectiveA * effectiveD}, bc ={" "}
            {effectiveB * effectiveC} ⇒ |ad-bc| ={" "}
            {Math.abs(effectiveA * effectiveD - effectiveB * effectiveC)}
          </text>
          <text
            x={375}
            y={16}
            textAnchor="end"
            fontSize={fontScale(8.5)}
            fill={
              isLargeSampleValid
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.paramSecondary
            }
            fontWeight="bold"
          >
            {isLargeSampleValid
              ? "✓ 大样本条件满足 (n≥40, E≥5)"
              : "⚠ 样本偏小或E<5 (宜参考Yates)"}
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 2：右上区 —— 条件频率等高条形图 (含水平基准落差线 Δp 与直观评价) */}
      {/* ========================================================================= */}
      <g transform="translate(430, 50)">
        <text
          x={4}
          y={11}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【等高条形图 · 条件频率差异分析】
        </text>

        {/* 等高图外框卡片 */}
        <g transform="translate(0, 18)">
          <rect
            x={0}
            y={0}
            width={380}
            height={178}
            rx={8}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 柱 1: 类 A */}
          <g transform={`translate(${45}, 24)`}>
            <text
              x={40}
              y={-7}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fontWeight="bold"
              fill={MATH_COLORS.paramPrimary}
            >
              {labelA.length > 5 ? `${labelA.slice(0, 4)}..` : labelA} (n₁=
              {row1Total})
            </text>
            {/* 上部 B */}
            <rect
              x={0}
              y={0}
              width={80}
              height={108 * ratioA_B}
              fill={MATH_COLORS.paramPrimary}
              rx={3}
              opacity={0.9}
            />
            {ratioA_B > 0.12 && (
              <text
                x={40}
                y={54 * ratioA_B + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                p₁={(ratioA_B * 100).toFixed(1)}%
              </text>
            )}
            {/* 下部 非B */}
            <rect
              x={0}
              y={108 * ratioA_B}
              width={80}
              height={108 * ratioA_NotB}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
              rx={3}
            />
            {ratioA_NotB > 0.12 && (
              <text
                x={40}
                y={108 * ratioA_B + 54 * ratioA_NotB + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                {(ratioA_NotB * 100).toFixed(1)}%
              </text>
            )}
          </g>

          {/* 柱 2: 类 非A */}
          <g transform={`translate(${255}, 24)`}>
            <text
              x={40}
              y={-7}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fontWeight="bold"
              fill={CANVAS_COLORS.labelText}
            >
              {labelNotA.length > 5 ? `${labelNotA.slice(0, 4)}..` : labelNotA}{" "}
              (n₂={row2Total})
            </text>
            {/* 上部 B (使用与柱1相同的事件主色，确保视觉对比严格对应事件B的发生比例) */}
            <rect
              x={0}
              y={0}
              width={80}
              height={108 * ratioNotA_B}
              fill={MATH_COLORS.paramPrimary}
              rx={3}
              opacity={0.9}
            />
            {ratioNotA_B > 0.12 && (
              <text
                x={40}
                y={54 * ratioNotA_B + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                p₂={(ratioNotA_B * 100).toFixed(1)}%
              </text>
            )}
            {/* 下部 非B */}
            <rect
              x={0}
              y={108 * ratioNotA_B}
              width={80}
              height={108 * ratioNotA_NotB}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
              rx={3}
            />
            {ratioNotA_NotB > 0.12 && (
              <text
                x={40}
                y={108 * ratioNotA_B + 54 * ratioNotA_NotB + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                {(ratioNotA_NotB * 100).toFixed(1)}%
              </text>
            )}
          </g>

          {/* 水平对比基准虚线与落差指示 */}
          {row1Total > 0 && row2Total > 0 && (
            <g>
              <line
                x1={125}
                y1={24 + 108 * ratioA_B}
                x2={255}
                y2={24 + 108 * ratioA_B}
                stroke={MATH_COLORS.paramPrimary}
                strokeDasharray="3 3"
                strokeWidth={1.2}
              />
              <line
                x1={125}
                y1={24 + 108 * ratioNotA_B}
                x2={255}
                y2={24 + 108 * ratioNotA_B}
                stroke={CANVAS_COLORS.labelTextLight}
                strokeDasharray="3 3"
                strokeWidth={1.2}
              />

              {/* 落差指示标牌 */}
              {deltaP > 0.01 && (
                <g>
                  <line
                    x1={190}
                    y1={24 + 108 * ratioA_B}
                    x2={190}
                    y2={24 + 108 * ratioNotA_B}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={2}
                  />
                  <rect
                    x={145}
                    y={
                      24 +
                      108 * Math.min(ratioA_B, ratioNotA_B) +
                      (108 * deltaP) / 2 -
                      12
                    }
                    width={90}
                    height={24}
                    rx={5}
                    fill={MATH_COLORS.paramTertiary}
                    filter="drop-shadow(0 1px 3px rgba(0,0,0,0.12))"
                  />
                  <text
                    x={190}
                    y={
                      24 +
                      108 * Math.min(ratioA_B, ratioNotA_B) +
                      (108 * deltaP) / 2 +
                      3
                    }
                    textAnchor="middle"
                    fill={CANVAS_COLORS.white}
                    fontSize={fontScale(8.5)}
                    fontWeight="bold"
                  >
                    落差|p₁-p₂|: {(deltaP * 100).toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 底部图例 */}
          <g transform="translate(100, 155)">
            <rect
              x={0}
              y={0}
              width={14}
              height={9}
              fill={MATH_COLORS.paramPrimary}
              rx={2}
            />
            <text
              x={18}
              y={8}
              fontSize={fontScale(9)}
              fill={CANVAS_COLORS.labelText}
              fontWeight="bold"
            >
              具有属性: {labelB}
            </text>

            <rect
              x={110}
              y={0}
              width={14}
              height={9}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
              rx={2}
            />
            <text
              x={128}
              y={8}
              fontSize={fontScale(9)}
              fill={CANVAS_COLORS.labelTextLight}
            >
              无属性: {labelNotB}
            </text>
          </g>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 3：下半区 —— χ²(1) 连续概率分布曲线 · 多级拒绝域 · 高考决策临界标尺 */}
      {/* ========================================================================= */}
      <g transform="translate(0, 5)">
        <text
          x={29}
          y={268}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【χ² (自由度 df=1) 连续概率分布曲线 · 显著性拒绝域面积 ·
          高考临界决策标尺】
        </text>

        {/* 背景卡片 */}
        <rect
          x={25}
          y={276}
          width={785}
          height={340}
          rx={8}
          fill={CANVAS_COLORS.white}
          stroke={CANVAS_COLORS.grid}
          strokeWidth={1}
        />

        {/* 多级拒绝域分段着色阴影 */}
        {/* 1. 接受域阴影 (0.08 ~ 3.841) */}
        <path
          d={acceptAreaPath}
          fill={withAlpha(CANVAS_COLORS.labelTextLight, 0.08)}
        />

        {/* 2. 95% 拒绝域 (3.841 ~ 6.635, α ≤ 0.05) */}
        <path
          d={p95AreaPath}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.22)}
        />

        {/* 3. 99% 拒绝域 (6.635 ~ 10.828, α ≤ 0.01) */}
        <path
          d={p99AreaPath}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.38)}
        />

        {/* 4. 99.9% 极显著拒绝域 (10.828 ~ 15, α ≤ 0.001) */}
        <path
          d={p999AreaPath}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.55)}
        />

        {/* χ²(1) 连续密度曲线主体 */}
        <path
          d={chiCurvePath}
          fill="none"
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2.4}
        />

        {/* 曲线左上侧公式与说明 */}
        <text
          x={chiStartX + 8}
          y={302}
          fontSize={fontScale(9.5)}
          fill={CANVAS_COLORS.labelTextLight}
          fontWeight="bold"
        >
          概率密度函数 f(x) = (2πx)⁻¹/² · e⁻ˣ/²
        </text>
        <text
          x={chiEndX - 8}
          y={302}
          textAnchor="end"
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.paramTertiary}
          fontWeight="bold"
        >
          阴影区为拒绝域: P(χ² ≥ 3.841) = 0.05 · P(χ² ≥ 6.635) = 0.01 · P(χ² ≥
          10.828) = 0.001
        </text>

        {/* 主数轴基线 */}
        <line
          x1={chiStartX}
          y1={chiAxisY}
          x2={chiEndX}
          y2={chiAxisY}
          stroke={CANVAS_COLORS.labelTextLight}
          strokeWidth={2}
        />
        <text
          x={chiEndX + 12}
          y={chiAxisY + 4}
          fontSize={fontScale(11)}
          fill={CANVAS_COLORS.labelText}
          fontWeight="bold"
        >
          χ²
        </text>

        {/* 高考关键临界值刻度标尺与垂直投影虚线 */}
        {[
          { val: 0, label: "0", alpha: "接受 H₀ (无关联)", alphaOffsetY: 24 },
          {
            val: 2.706,
            label: "2.706",
            alpha: "α=0.10 (90%)",
            alphaOffsetY: 24,
          },
          {
            val: 3.841,
            label: "3.841",
            alpha: "α=0.05 (95%基准)",
            alphaOffsetY: 37,
            isKey: true,
          },
          {
            val: 6.635,
            label: "6.635",
            alpha: "α=0.01 (99%高频)",
            alphaOffsetY: 24,
            isKey: true,
          },
          {
            val: 10.828,
            label: "10.828",
            alpha: "α=0.001 (99.9%)",
            alphaOffsetY: 37,
            isKey: true,
          },
        ].map((tick) => {
          const tx = getChiX(tick.val);
          const pdfVal = getChiSquare1Pdf(tick.val);
          const curveTopY = chiPlotBaseY - Math.min(chiPlotHeight, pdfVal * 85);
          return (
            <g key={`crit-tick-${tick.val}`}>
              {/* 投向曲线的垂直参考虚线 */}
              {tick.val > 0 && (
                <line
                  x1={tx}
                  y1={chiAxisY}
                  x2={tx}
                  y2={curveTopY}
                  stroke={
                    tick.isKey ? MATH_COLORS.paramTertiary : CANVAS_COLORS.grid
                  }
                  strokeWidth={tick.isKey ? 1.4 : 1}
                  strokeDasharray="3 3"
                />
              )}
              {/* 刻度短线 */}
              <line
                x1={tx}
                y1={chiAxisY - 5}
                x2={tx}
                y2={chiAxisY + 5}
                stroke={CANVAS_COLORS.labelText}
                strokeWidth={1.5}
              />
              {/* 刻度数值 */}
              <text
                x={tx}
                y={chiAxisY + 15}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fontWeight={tick.isKey ? "bold" : "normal"}
                fill={
                  tick.isKey
                    ? MATH_COLORS.paramPrimary
                    : CANVAS_COLORS.labelText
                }
              >
                {tick.label}
              </text>
              {/* 显著性水平 α */}
              <text
                x={tx}
                y={chiAxisY + tick.alphaOffsetY}
                textAnchor="middle"
                fontSize={fontScale(8)}
                fontWeight={tick.isKey ? "bold" : "normal"}
                fill={
                  tick.isKey
                    ? MATH_COLORS.paramTertiary
                    : CANVAS_COLORS.labelTextLight
                }
              >
                {tick.alpha}
              </text>
            </g>
          );
        })}

        {/* 动态计算出的当前 χ² 观测值指针与浮动标牌 */}
        <g>
          {/* 指针箭头 (若超限停靠在最右端并带折断指示) */}
          <polygon
            points={`${currChiX},${chiAxisY - 6} ${currChiX - 6},${chiAxisY - 16} ${currChiX + 6},${chiAxisY - 16}`}
            fill={
              indResult.p95
                ? MATH_COLORS.paramPrimary
                : MATH_COLORS.paramTertiary
            }
          />
          {/* 垂直连接虚线 */}
          <line
            x1={currChiX}
            y1={chiAxisY - 16}
            x2={currChiX}
            y2={chiAxisY - 100}
            stroke={
              indResult.p95
                ? MATH_COLORS.paramPrimary
                : MATH_COLORS.paramTertiary
            }
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />

          {/* 超限标尺折断标识 */}
          {isChiOverflow && (
            <g transform={`translate(${chiEndX - 15}, ${chiAxisY - 8})`}>
              <line
                x1={0}
                y1={-6}
                x2={6}
                y2={6}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2}
              />
              <line
                x1={4}
                y1={-6}
                x2={10}
                y2={6}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2}
              />
              <text
                x={14}
                y={-6}
                fontSize={fontScale(8)}
                fill={MATH_COLORS.paramPrimary}
                fontWeight="bold"
              >
                ≫
              </text>
            </g>
          )}

          {/* 浮动结果胶囊卡片 */}
          <g transform={`translate(${cardCenterX}, ${chiAxisY - 105})`}>
            <rect
              x={-105}
              y={-34}
              width={210}
              height={34}
              rx={6}
              fill={
                indResult.p95
                  ? MATH_COLORS.paramPrimary
                  : MATH_COLORS.paramTertiary
              }
              filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.18))"
            />
            <text
              x={0}
              y={-18}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
            >
              当前观测值 χ² = {indResult.chiSquare.toFixed(3)}{" "}
              {isChiOverflow ? "(≫ 15 极显著)" : ""}
            </text>
            <text
              x={0}
              y={-4}
              textAnchor="middle"
              fill={withAlpha(CANVAS_COLORS.white, 0.94)}
              fontSize={fontScale(8.5)}
            >
              {indResult.p999
                ? "✓ 达 99.9% 把握关联 (拒绝 H₀, α=0.001)"
                : indResult.p99
                  ? "✓ 达 99% 把握关联 (拒绝 H₀, α=0.01)"
                  : indResult.p95
                    ? "✓ 达 95% 把握关联 (拒绝 H₀, α=0.05)"
                    : "✗ 未达 95% 临界 (接受零假设 H₀, 无关联)"}
            </text>
          </g>
        </g>
      </g>
    </g>
  );
};
