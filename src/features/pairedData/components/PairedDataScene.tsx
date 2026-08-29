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
    const points = sampleChiSquareCurvePoints(0.08, maxChi, 80);
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

  // 生成 >= 3.841 临界值的拒绝域阴影封闭路径
  const rejectAreaPath = useMemo(() => {
    if (studyMode !== "independence") return "";
    const startChi = 3.841;
    const startPx = chiStartX + (startChi / maxChi) * chiPlotWidth;
    const segments: string[] = [`M ${startPx.toFixed(1)} ${chiPlotBaseY}`];
    const points = sampleChiSquareCurvePoints(startChi, maxChi, 40);
    for (const p of points) {
      const px = mapChiValueToPixel(p.chi, maxChi, chiStartX, chiPlotWidth);
      const py = chiPlotBaseY - Math.min(chiPlotHeight, p.pdf * 85);
      segments.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    segments.push(
      `L ${(chiStartX + chiPlotWidth).toFixed(1)} ${chiPlotBaseY} Z`,
    );
    return segments.join(" ");
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
  const chiAxisY = 540;
  const isChiOverflow = indResult.chiSquare > maxChi;
  const currChiX = getChiX(indResult.chiSquare);
  // 浮动标牌水平中心安全钳位 (卡片宽 170px，半宽 85px)
  const cardCenterX = isChiOverflow
    ? chiEndX - 90
    : Math.max(chiStartX + 85, Math.min(chiEndX - 85, currChiX));

  return (
    <g className="paired-data-scene-independence" transform="translate(0, 0)">
      {/* 背景主卡片 */}
      <rect
        x={15}
        y={10}
        width={810}
        height={630}
        rx={12}
        fill={CANVAS_COLORS.gridSubtle}
        stroke={CANVAS_COLORS.grid}
        strokeWidth={1}
      />

      {/* 顶部主标题与核心计算公式胶囊栏 */}
      <g transform="translate(0, 30)">
        <text
          x={30}
          y={4}
          fontSize={fontScale(15)}
          fontWeight="bold"
          fill={CANVAS_COLORS.labelText}
        >
          2 × 2 列联表独立性检验实验室
        </text>

        {/* 顶部右侧公式胶囊 */}
        <rect
          x={360}
          y={-14}
          width={445}
          height={28}
          rx={14}
          fill={CANVAS_COLORS.white}
          stroke={CANVAS_COLORS.grid}
          strokeWidth={1}
        />
        <text
          x={582}
          y={4}
          textAnchor="middle"
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.paramPrimary}
          fontWeight="bold"
        >
          χ² = n(ad - bc)² / [(a+b)(c+d)(a+c)(b+d)] ={" "}
          {indResult.chiSquare.toFixed(3)}
        </text>
      </g>

      {/* ========================================================================= */}
      {/* 模块 1：左上区 —— 2×2 列联表双层矩阵 (四格表 + 边际合计 + 期望频数 E) */}
      {/* ========================================================================= */}
      <g transform="translate(30, 52)">
        <text
          x={5}
          y={12}
          fontSize={fontScale(12)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【2 × 2 列联表四格矩阵 (观测频数 O 与 期望频数 E)】
        </text>

        {/* 表格外框卡片 */}
        <g transform="translate(0, 20)">
          <rect
            x={0}
            y={0}
            width={375}
            height={180}
            rx={8}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 表头横纵分割线 */}
          <line
            x1={0}
            y1={32}
            x2={375}
            y2={32}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={81}
            x2={375}
            y2={81}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={130}
            x2={375}
            y2={130}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          <line
            x1={95}
            y1={0}
            x2={95}
            y2={180}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={188}
            y1={0}
            x2={188}
            y2={180}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={281}
            y1={0}
            x2={281}
            y2={180}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 列表头 */}
          <text
            x={47}
            y={21}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={CANVAS_COLORS.labelTextLight}
            fontWeight="bold"
          >
            分类指标
          </text>
          <text
            x={141}
            y={21}
            textAnchor="middle"
            fontSize={labelB.length > 4 ? fontScale(9.5) : fontScale(11)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            {labelB}
          </text>
          <text
            x={234}
            y={21}
            textAnchor="middle"
            fontSize={labelNotB.length > 4 ? fontScale(9.5) : fontScale(11)}
            fill={CANVAS_COLORS.labelTextLight}
            fontWeight="bold"
          >
            {labelNotB}
          </text>
          <text
            x={328}
            y={21}
            textAnchor="middle"
            fontSize={fontScale(10.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            行合计
          </text>

          {/* 行 1: labelA */}
          <text
            x={47}
            y={60}
            textAnchor="middle"
            fontSize={labelA.length > 4 ? fontScale(9.5) : fontScale(11)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            {labelA}
          </text>

          {/* 格 1 (a) */}
          <rect
            x={96}
            y={33}
            width={91}
            height={47}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          />
          <text
            x={141}
            y={54}
            textAnchor="middle"
            fontSize={fontScale(14)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            a = {effectiveA}
          </text>
          <text
            x={141}
            y={70}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            E={indResult.expected.eA.toFixed(1)} | D=
            {indResult.contributions.dA.toFixed(2)}
          </text>

          {/* 格 2 (b) */}
          <rect
            x={189}
            y={33}
            width={91}
            height={47}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.05)}
          />
          <text
            x={234}
            y={54}
            textAnchor="middle"
            fontSize={fontScale(14)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            b = {effectiveB}
          </text>
          <text
            x={234}
            y={70}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            E={indResult.expected.eB.toFixed(1)} | D=
            {indResult.contributions.dB.toFixed(2)}
          </text>

          {/* 行 1 合计 */}
          <text
            x={328}
            y={60}
            textAnchor="middle"
            fontSize={fontScale(12.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {row1Total}
          </text>

          {/* 行 2: labelNotA */}
          <text
            x={47}
            y={109}
            textAnchor="middle"
            fontSize={labelNotA.length > 4 ? fontScale(9.5) : fontScale(11)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            {labelNotA}
          </text>

          {/* 格 3 (c) */}
          <rect
            x={96}
            y={82}
            width={91}
            height={47}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.06)}
          />
          <text
            x={141}
            y={103}
            textAnchor="middle"
            fontSize={fontScale(14)}
            fill={MATH_COLORS.paramTertiary}
            fontWeight="bold"
          >
            c = {effectiveC}
          </text>
          <text
            x={141}
            y={119}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            E={indResult.expected.eC.toFixed(1)} | D=
            {indResult.contributions.dC.toFixed(2)}
          </text>

          {/* 格 4 (d) */}
          <rect
            x={189}
            y={82}
            width={91}
            height={47}
            fill={withAlpha(CANVAS_COLORS.labelTextLight, 0.06)}
          />
          <text
            x={234}
            y={103}
            textAnchor="middle"
            fontSize={fontScale(14)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            d = {effectiveD}
          </text>
          <text
            x={234}
            y={119}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            E={indResult.expected.eD.toFixed(1)} | D=
            {indResult.contributions.dD.toFixed(2)}
          </text>

          {/* 行 2 合计 */}
          <text
            x={328}
            y={109}
            textAnchor="middle"
            fontSize={fontScale(12.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {row2Total}
          </text>

          {/* 列合计行 */}
          <text
            x={47}
            y={158}
            textAnchor="middle"
            fontSize={fontScale(10.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            列合计
          </text>
          <text
            x={141}
            y={158}
            textAnchor="middle"
            fontSize={fontScale(12.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {col1Total}
          </text>
          <text
            x={234}
            y={158}
            textAnchor="middle"
            fontSize={fontScale(12.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {col2Total}
          </text>

          {/* 总样本数 n */}
          <rect
            x={282}
            y={131}
            width={92}
            height={48}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
            rx={4}
          />
          <text
            x={328}
            y={151}
            textAnchor="middle"
            fontSize={fontScale(9.5)}
            fill={MATH_COLORS.paramPrimary}
          >
            总样本量
          </text>
          <text
            x={328}
            y={168}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            n = {totalN}
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 2：右上区 —— 条件频率等高条形图 (含水平基准落差线 Δp) */}
      {/* ========================================================================= */}
      <g transform="translate(430, 52)">
        <text
          x={5}
          y={12}
          fontSize={fontScale(12)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【等高条形图与条件频率落差 Δp】
        </text>

        {/* 等高图外框 */}
        <g transform="translate(0, 20)">
          <rect
            x={0}
            y={0}
            width={380}
            height={180}
            rx={8}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 柱 1: 类 A */}
          <g transform={`translate(${50}, 28)`}>
            <text
              x={45}
              y={-8}
              textAnchor="middle"
              fontSize={fontScale(10)}
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
              width={90}
              height={110 * ratioA_B}
              fill={MATH_COLORS.paramPrimary}
              rx={3}
              opacity={0.88}
            />
            {ratioA_B > 0.15 && (
              <text
                x={45}
                y={55 * ratioA_B + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(9.5)}
                fontWeight="bold"
              >
                {(ratioA_B * 100).toFixed(1)}%
              </text>
            )}
            {/* 下部 非B */}
            <rect
              x={0}
              y={110 * ratioA_B}
              width={90}
              height={110 * ratioA_NotB}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.35)}
              rx={3}
            />
            {ratioA_NotB > 0.15 && (
              <text
                x={45}
                y={110 * ratioA_B + 55 * ratioA_NotB + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(9.5)}
                fontWeight="bold"
              >
                {(ratioA_NotB * 100).toFixed(1)}%
              </text>
            )}
          </g>

          {/* 柱 2: 类 非A */}
          <g transform={`translate(${240}, 28)`}>
            <text
              x={45}
              y={-8}
              textAnchor="middle"
              fontSize={fontScale(10)}
              fontWeight="bold"
              fill={MATH_COLORS.paramSecondary}
            >
              {labelNotA.length > 5 ? `${labelNotA.slice(0, 4)}..` : labelNotA}{" "}
              (n₂={row2Total})
            </text>
            {/* 上部 B */}
            <rect
              x={0}
              y={0}
              width={90}
              height={110 * ratioNotA_B}
              fill={MATH_COLORS.paramSecondary}
              rx={3}
              opacity={0.88}
            />
            {ratioNotA_B > 0.15 && (
              <text
                x={45}
                y={55 * ratioNotA_B + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(9.5)}
                fontWeight="bold"
              >
                {(ratioNotA_B * 100).toFixed(1)}%
              </text>
            )}
            {/* 下部 非B */}
            <rect
              x={0}
              y={110 * ratioNotA_B}
              width={90}
              height={110 * ratioNotA_NotB}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.35)}
              rx={3}
            />
            {ratioNotA_NotB > 0.15 && (
              <text
                x={45}
                y={110 * ratioNotA_B + 55 * ratioNotA_NotB + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(9.5)}
                fontWeight="bold"
              >
                {(ratioNotA_NotB * 100).toFixed(1)}%
              </text>
            )}
          </g>

          {/* 水平对比基准虚线 (从柱1分割点延伸到柱2分割点) */}
          {row1Total > 0 && row2Total > 0 && (
            <g>
              <line
                x1={140}
                y1={28 + 110 * ratioA_B}
                x2={240}
                y2={28 + 110 * ratioA_B}
                stroke={MATH_COLORS.paramPrimary}
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <line
                x1={140}
                y1={28 + 110 * ratioNotA_B}
                x2={240}
                y2={28 + 110 * ratioNotA_B}
                stroke={MATH_COLORS.paramSecondary}
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              {/* 落差指示标牌 */}
              {deltaP > 0.02 && (
                <g>
                  <line
                    x1={190}
                    y1={28 + 110 * ratioA_B}
                    x2={190}
                    y2={28 + 110 * ratioNotA_B}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={2}
                  />
                  <rect
                    x={158}
                    y={
                      28 +
                      110 * Math.min(ratioA_B, ratioNotA_B) +
                      (110 * deltaP) / 2 -
                      9
                    }
                    width={64}
                    height={18}
                    rx={4}
                    fill={MATH_COLORS.paramTertiary}
                  />
                  <text
                    x={190}
                    y={
                      28 +
                      110 * Math.min(ratioA_B, ratioNotA_B) +
                      (110 * deltaP) / 2 +
                      3.5
                    }
                    textAnchor="middle"
                    fill={CANVAS_COLORS.white}
                    fontSize={fontScale(8.5)}
                    fontWeight="bold"
                  >
                    落差:{(deltaP * 100).toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 底部图例 */}
          <g transform="translate(115, 160)">
            <rect
              x={0}
              y={0}
              width={12}
              height={8}
              fill={MATH_COLORS.paramPrimary}
              rx={1}
            />
            <text
              x={16}
              y={8}
              fontSize={fontScale(9.5)}
              fill={CANVAS_COLORS.labelTextLight}
            >
              {labelB}
            </text>

            <rect
              x={85}
              y={0}
              width={12}
              height={8}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.35)}
              rx={1}
            />
            <text
              x={101}
              y={8}
              fontSize={fontScale(9.5)}
              fill={CANVAS_COLORS.labelTextLight}
            >
              {labelNotB}
            </text>
          </g>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 3：下半区 —— χ²(1) 连续概率分布曲线与高考决策临界标尺 */}
      {/* ========================================================================= */}
      <g transform="translate(0, 10)">
        <text
          x={35}
          y={268}
          fontSize={fontScale(12)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【χ² (自由度 df=1) 概率分布曲线 · 拒绝域面积 · 高考临界值标尺】
        </text>

        {/* 背景卡片 */}
        <rect
          x={30}
          y={278}
          width={780}
          height={330}
          rx={8}
          fill={CANVAS_COLORS.white}
          stroke={CANVAS_COLORS.grid}
          strokeWidth={1}
        />

        {/* 拒绝域背景阴影 (α = 0.05 对应 χ² ≥ 3.841 尾部区域) */}
        <path
          d={rejectAreaPath}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.22)}
        />

        {/* χ²(1) 连续密度曲线 */}
        <path
          d={chiCurvePath}
          fill="none"
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
        />

        {/* 曲线左上侧公式与说明 */}
        <text
          x={chiStartX + 10}
          y={305}
          fontSize={fontScale(10)}
          fill={CANVAS_COLORS.labelTextLight}
          fontWeight="bold"
        >
          概率密度曲线 f(x) = (2πx)⁻¹/² · e⁻ˣ/²
        </text>
        <text
          x={chiEndX - 10}
          y={305}
          textAnchor="end"
          fontSize={fontScale(10)}
          fill={MATH_COLORS.paramTertiary}
          fontWeight="bold"
        >
          绿色阴影为拒绝域: P(χ² ≥ 3.841) = 0.05 (犯错概率 ≤ 5%)
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
          x={chiEndX + 10}
          y={chiAxisY + 4}
          fontSize={fontScale(11)}
          fill={CANVAS_COLORS.labelText}
          fontWeight="bold"
        >
          χ²
        </text>

        {/* 高考关键临界值刻度标尺与垂直投影虚线 (通过错落垂直高度彻底避免横向碰撞) */}
        {[
          { val: 0, label: "0", alpha: "接受 H₀", alphaOffsetY: 26 },
          { val: 2.706, label: "2.706", alpha: "α=0.10", alphaOffsetY: 26 },
          {
            val: 3.841,
            label: "3.841",
            alpha: "α=0.05 (95%)",
            alphaOffsetY: 38,
            isKey: true,
          },
          {
            val: 6.635,
            label: "6.635",
            alpha: "α=0.01 (99%)",
            alphaOffsetY: 26,
            isKey: true,
          },
          { val: 10.828, label: "10.828", alpha: "α=0.001", alphaOffsetY: 26 },
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
                  strokeWidth={tick.isKey ? 1.5 : 1}
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
              {/* 显著性水平 α (高低错落避免重叠) */}
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

        {/* 动态计算出的当前 χ² 观测值指针与浮动标牌 (安全停靠与垂直对齐) */}
        <g>
          {/* 指针箭头 (若超限停靠在最右端) */}
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
          {/* 浮动结果胶囊卡片 */}
          <g transform={`translate(${cardCenterX}, ${chiAxisY - 100})`}>
            <rect
              x={-85}
              y={-32}
              width={170}
              height={32}
              rx={6}
              fill={
                indResult.p95
                  ? MATH_COLORS.paramPrimary
                  : MATH_COLORS.paramTertiary
              }
              filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
            />
            <text
              x={0}
              y={-16}
              textAnchor="middle"
              fill={CANVAS_COLORS.white}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
            >
              当前 χ² = {indResult.chiSquare.toFixed(3)}{" "}
              {isChiOverflow ? "(≫ 15)" : ""}
            </text>
            <text
              x={0}
              y={-3}
              textAnchor="middle"
              fill={withAlpha(CANVAS_COLORS.white, 0.92)}
              fontSize={fontScale(8.5)}
            >
              {indResult.p99
                ? "✓ 超99%把握关联 (拒绝H₀)"
                : indResult.p95
                  ? "✓ 超95%把握关联 (拒绝H₀)"
                  : "✗ 未达95%临界 (接受H₀)"}
            </text>
          </g>
        </g>
      </g>
    </g>
  );
};
