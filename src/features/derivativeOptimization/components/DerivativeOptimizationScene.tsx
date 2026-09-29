/**
 * 导数实际生活优化建模中屏 SVG 场景
 * 呈现：物理几何结构示意（左） + 目标函数与导数为零的点切线曲线图（右）
 */
import React, { useMemo, useCallback } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { withAlpha } from "@/theme";
import {
  getOptimizationPalette,
  OPT_CARD_COLORS as C,
} from "@/features/derivativeOptimization/scenePalette";
import { dashArrayOf } from "@/components/Math/scenePalette";
import {
  calculateOptimizationModel,
  OPTIMIZATION_CONSTANTS,
  type OptimizationModelType,
} from "@/math/derivativeOptimization";
import { formatMathNumber } from "@/utils/mathFormat";
import { optimizationParamMeta } from "@/data/registries/derivativeOptimization";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";

/** 模型 → 左屏当前自变量参数键（与 registries/derivativeOptimization 的键一一对应） */
const PARAM_KEY_BY_MODEL: Record<
  OptimizationModelType,
  keyof typeof optimizationParamMeta
> = {
  box: "box_x",
  can: "can_r",
  profit: "profit_x",
};

interface DerivativeOptimizationSceneProps {
  modelType: OptimizationModelType;
  xVal: number;
  scale: SceneScale;
  fontScale?: (v: number) => number;
  onChangeX: (newX: number) => void;
}

export const DerivativeOptimizationScene: React.FC<
  DerivativeOptimizationSceneProps
> = ({ modelType, xVal, scale, fontScale = (v) => v, onChangeX }) => {
  const res = useMemo(
    () => calculateOptimizationModel(modelType, xVal),
    [modelType, xVal],
  );

  /**
   * 动点拖拽统一落点：声明域取左屏滑块注册表，再与可见视口求交。
   * 注册表的 min/max 又由 `OPTIMIZATION_CONSTANTS.<model>.slider` 派生，与 math 层的数值
   * 截断边界同源 —— 三者（滑块域 / 拖拽域 / 截断域）任一改动只能从常量表一处出发。
   */
  const xMeta = optimizationParamMeta[PARAM_KEY_BY_MODEL[modelType]];
  const dragXRange = useMemo(
    () => paramDragRange(xMeta, scale, "x"),
    [xMeta, scale],
  );

  const handleDragX = useCallback(
    (rawX: number) => {
      onChangeX(snapDragValue(rawX, xMeta.step, dragXRange));
    },
    [onChangeX, xMeta, dragXRange],
  );

  // 函数求值器：在物理定义域外不画（而不是拿一个越界值继续画）
  const funcEvaluator = useCallback(
    (x: number) => {
      if (x < res.domainMin || x > res.domainMax) return NaN;
      const r = calculateOptimizationModel(modelType, x);
      return r.yVal;
    },
    [modelType, res.domainMin, res.domainMax],
  );

  // 导数为零的点水平切线（在最优点处斜率为 0）
  const optimalPointDesign = useMemo(() => {
    return mathToDesign(res.optimalX, res.optimalY, scale);
  }, [res.optimalX, res.optimalY, scale]);

  // 当前探究点在画布上的设计坐标
  const currentPointDesign = useMemo(() => {
    return mathToDesign(res.xVal, res.yVal, scale);
  }, [res.xVal, res.yVal, scale]);

  // 本页调色板：图例与画布的唯一颜色来源（见 scenePalette.ts）
  const P = getOptimizationPalette();

  const labels = useMemo((): LabelItem[] => {
    return [
      {
        key: "current-point",
        text: `P(${formatMathNumber(res.xVal)}, ${formatMathNumber(res.yVal)})`,
        x: currentPointDesign.x,
        y: currentPointDesign.y,
        color: P.currentPoint.color,
      },
      {
        key: "optimal-point",
        text: `最大值点 (${formatMathNumber(res.optimalX)}, ${formatMathNumber(res.optimalY)})`,
        x: optimalPointDesign.x,
        y: optimalPointDesign.y - 10,
        color: P.optimalPoint.color,
      },
    ];
  }, [
    res.xVal,
    res.yVal,
    res.optimalX,
    res.optimalY,
    currentPointDesign,
    optimalPointDesign,
    P.currentPoint.color,
    P.optimalPoint.color,
  ]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 目标函数曲线 */}
      <FunctionGraph
        fn={funcEvaluator}
        scale={scale}
        color={P.target.color}
        strokeWidth={P.target.width}
      />

      {/* 导数为零的点水平切线 (k = 0) */}
      <line
        x1={scale.originX - 100}
        y1={optimalPointDesign.y}
        x2={scale.originX + 380}
        y2={optimalPointDesign.y}
        stroke={P.optimalTangent.color}
        strokeWidth={P.optimalTangent.width}
        strokeDasharray={dashArrayOf(P.optimalTangent)}
      />

      {/* 导数为零的点最优标记点 */}
      <circle
        cx={optimalPointDesign.x}
        cy={optimalPointDesign.y}
        r={5}
        fill={P.optimalPoint.color}
        stroke={C.contrast}
        strokeWidth={1.5}
      />

      {/* 动态交互探究点 */}
      <InteractivePoint
        cx={res.xVal}
        cy={res.yVal}
        scale={scale}
        color={P.currentPoint.color}
        onDrag={(pt) => handleDragX(pt.x)}
        axis="x"
        xRange={dragXRange}
        edgeClampProjection
      />

      {/* 左上方：几何物理建模展开示意卡片 */}
      <g transform="translate(60, 40)">
        <rect
          x={0}
          y={0}
          width={180}
          height={150}
          rx={8}
          fill={withAlpha(C.panel, 0.92)}
          stroke={C.panelEdge}
          strokeWidth={1}
        />
        <text
          x={12}
          y={22}
          fill={C.title}
          fontSize={fontScale(11)}
          fontWeight="bold"
        >
          {modelType === "box"
            ? "正方形铁皮剪切折叠盒"
            : modelType === "can"
              ? "圆柱易拉罐容积与展开"
              : "企业经济产量与边际分析"}
        </text>

        {modelType === "box" && (
          <g transform="translate(45, 38)">
            {/* 正方形铁皮轮廓 */}
            <rect
              x={0}
              y={0}
              width={90}
              height={90}
              fill={withAlpha(C.boxSheet, 0.15)}
              stroke={C.boxSheet}
              strokeWidth={1.5}
            />
            {/* 剪去四个角的小正方形 */}
            <rect
              x={0}
              y={0}
              width={22}
              height={22}
              fill={withAlpha(C.boxCut, 0.4)}
              stroke={C.boxCut}
              strokeWidth={1}
            />
            <rect
              x={68}
              y={0}
              width={22}
              height={22}
              fill={withAlpha(C.boxCut, 0.4)}
              stroke={C.boxCut}
              strokeWidth={1}
            />
            <rect
              x={0}
              y={68}
              width={22}
              height={22}
              fill={withAlpha(C.boxCut, 0.4)}
              stroke={C.boxCut}
              strokeWidth={1}
            />
            <rect
              x={68}
              y={68}
              width={22}
              height={22}
              fill={withAlpha(C.boxCut, 0.4)}
              stroke={C.boxCut}
              strokeWidth={1}
            />
            {/* 折叠虚线 */}
            <line
              x1={22}
              y1={22}
              x2={68}
              y2={22}
              stroke={C.contrast}
              strokeDasharray="3 2"
            />
            <line
              x1={22}
              y1={68}
              x2={68}
              y2={68}
              stroke={C.contrast}
              strokeDasharray="3 2"
            />
            <line
              x1={22}
              y1={22}
              x2={22}
              y2={68}
              stroke={C.contrast}
              strokeDasharray="3 2"
            />
            <line
              x1={68}
              y1={22}
              x2={68}
              y2={68}
              stroke={C.contrast}
              strokeDasharray="3 2"
            />
            <text x={28} y={48} fill={C.inkLabel} fontSize={fontScale(10)}>
              底面 (L-2x)²
            </text>
            <text x={3} y={15} fill={C.inkParam} fontSize={fontScale(8)}>
              x
            </text>
          </g>
        )}

        {modelType === "can" && (
          <g transform="translate(60, 42)">
            {/* 圆柱侧面与上下底 */}
            <ellipse
              cx={30}
              cy={15}
              rx={25}
              ry={10}
              fill={withAlpha(C.canTop, 0.3)}
              stroke={C.canTop}
            />
            <rect
              x={5}
              y={15}
              width={50}
              height={55}
              fill={withAlpha(C.canSide, 0.2)}
              stroke={C.canSide}
            />
            <ellipse
              cx={30}
              cy={70}
              rx={25}
              ry={10}
              fill={withAlpha(C.canTop, 0.3)}
              stroke={C.canTop}
            />
            <text x={20} y={45} fill={C.inkLabel} fontSize={fontScale(10)}>
              V = {OPTIMIZATION_CONSTANTS.can.V}
            </text>
            <text x={12} y={74} fill={C.inkParam} fontSize={fontScale(9)}>
              r={formatMathNumber(res.xVal)}
            </text>
          </g>
        )}

        {modelType === "profit" && (
          <g transform="translate(25, 45)">
            <text x={0} y={18} fill={C.profitRevenue} fontSize={fontScale(10)}>
              总收益: R(x) = px - ax²
            </text>
            <text x={0} y={38} fill={C.profitCost} fontSize={fontScale(10)}>
              总成本: C(x) = c₀ + c₁x
            </text>
            <text x={0} y={58} fill={C.profitMargin} fontSize={fontScale(10)}>
              边际利润 P'(x) = 0 时最优
            </text>
          </g>
        )}
      </g>

      <SceneLabelGroup items={labels} fontScale={fontScale} />
    </g>
  );
};
