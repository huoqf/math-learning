/**
 * src/features/derivativeShift/constants.ts
 * 极值点偏移与隐零点实验室常量与图例配置
 */

import type { SceneLegendItem } from "@/components/Math";
import { MATH_COLORS } from "@/theme";

export type ShiftMode = "implicit_zero" | "shift_symmetric" | "log_mean";
export type ShiftSubModel = "x_ln_x" | "exp_linear" | "xe_neg_x" | "ln_x_div_x";

/* ------------------------------------------------------------------ *
 * 画布 x 可见域（**只由模型定义域与参数取值范围决定，绝不随当前参数值变化**）
 *
 * 铁律：同一个页面、同一个模型内，拖动滑块调参时坐标轴必须纹丝不动。
 * 坐标轴一旦跟着参数缩放，学生就无法分辨「图像变了」还是「坐标变了」，
 * 这是函数图象教学中最伤理解的一类隐式失真，因此本页可见域一律取常量。
 *
 * 由此产生的越界问题按下述方式处理，而不是回头让坐标轴去迁就：
 *  - ln x/x 模型的右根随割线高度 k 减小指数级右移
 *    （k = 0.24 → x₂ ≈ 9.3，k = 0.12 → x₂ ≈ 27.7，k = 0.05 → x₂ ≈ 90）；
 *    可见域按其典型教学区间（k ≥ 0.24，含默认预设 k = 0.25 与相切预设 k = 0.36）取到 9.3，
 *    更低的 k 由画布「空心点 + 右向箭头」越界标记 + 底部横坐标对照条（标「超出画布」）承担；
 *  - 对数均值链的右端点是可拖拽参数（预设 x₂ = e² ≈ 7.39，滑块上限 8.0），
 *    可见域按其参数上界一次性取到 8.8，全程不出框。
 * ------------------------------------------------------------------ */

/** 基准可见域：x·e^{-x} 模型在 k ∈ [0.05, 0.35] 全滑块区间内双根、镜像点与中点均在其中
 *  （x₂ 出框临界 k ≈ 0.0098，滑块不可达） */
export const SHIFT_BASE_X_RANGE: [number, number] = [-1.5, 6.5];
/** ln x/x 模型：定义域 x > 0，故左界不取负数；右界覆盖 k ≥ ln 9.3 / 9.3 ≈ 0.24 的全部双根 */
export const SHIFT_LOG_X_RANGE: [number, number] = [0.4, 9.3];
/** 对数均值链：右端点为参数，须覆盖其取值上界 x₂ = 8.0 */
export const LOG_MEAN_X_RANGE: [number, number] = [-1.5, 8.8];

/**
 * 取当前模式与模型下的画布 x 可见域。
 * 参数不参与：同一 (mode, model) 下任何参数取值都得到同一根坐标轴。
 */
export function getShiftXRange(
  activeMode: string,
  subModel: string,
): [number, number] {
  if (activeMode === "shift_symmetric" && subModel !== "xe_neg_x") {
    return SHIFT_LOG_X_RANGE;
  }
  if (activeMode === "log_mean") {
    return LOG_MEAN_X_RANGE;
  }
  return SHIFT_BASE_X_RANGE;
}

export function getDerivativeShiftLegendItems(
  activeMode: ShiftMode,
  subModel: ShiftSubModel,
): SceneLegendItem[] {
  if (activeMode === "implicit_zero") {
    return [
      {
        color: MATH_COLORS.function,
        label: "原函数",
        formula:
          subModel === "x_ln_x"
            ? "f(x) = x\\ln x + \\frac{1}{2}x^2 - ax"
            : "f(x) = e^x - \\frac{1}{2}x^2 - ax",
        style: "solid",
      },
      {
        color: MATH_COLORS.derivative,
        label: "导函数",
        formula:
          subModel === "x_ln_x"
            ? "f'(x) = \\ln x + x + 1 - a"
            : "f'(x) = e^x - x - a",
        style: "dash",
      },
      {
        color: MATH_COLORS.trace,
        label: "消元轨迹",
        formula:
          subModel === "x_ln_x"
            ? "h(x) = -\\frac{1}{2}x^2 - x"
            : "h(x) = e^x(1 - x) + \\frac{1}{2}x^2",
        style: "dot",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "极值消元点",
        formula: "P(x_0, f(x_0))",
        style: "point",
      },
      {
        color: MATH_COLORS.derivative,
        label: "导数零点",
        formula: "x_0",
        style: "hollow-point",
      },
    ];
  }

  if (activeMode === "shift_symmetric") {
    return [
      {
        color: MATH_COLORS.function,
        label: "原函数",
        formula:
          subModel === "xe_neg_x"
            ? "f(x) = xe^{-x}"
            : "f(x) = \\frac{\\ln x}{x}",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "对称曲线",
        formula: "y = f(2x_0 - x)",
        style: "dash",
      },
      {
        color: MATH_COLORS.secantLine,
        label: "水平割线",
        formula: "y = k",
        style: "solid",
      },
      {
        color: MATH_COLORS.focusPoint,
        label: "割线双交点",
        formula: "P_1, P_2",
        style: "point",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "对称构造点",
        formula: "P'_1(2x_0 - x_1, k)",
        style: "point",
      },
      {
        color: MATH_COLORS.paramTertiary,
        label: "弦中点",
        formula: "M\\left(\\frac{x_1+x_2}{2}, k\\right)",
        style: "point",
      },
    ];
  }

  return [
    {
      color: MATH_COLORS.function,
      label: "对数曲线",
      formula: "f(x) = \\ln x",
      style: "solid",
    },
    {
      color: MATH_COLORS.secantLine,
      label: "割线",
      formula: "P_1P_2",
      style: "solid",
    },
    {
      color: MATH_COLORS.tangentLine,
      label: "平行切线点",
      formula: "T(L, \\ln L)",
      style: "point",
    },
    {
      color: MATH_COLORS.paramSecondary,
      label: "几何均值",
      formula: "G = \\sqrt{x_1 x_2}",
      style: "point",
    },
    {
      color: MATH_COLORS.paramPrimary,
      label: "对数均值",
      formula: "L = L(x_1, x_2)",
      style: "point",
    },
    {
      color: MATH_COLORS.paramTertiary,
      label: "算术均值",
      formula: "A = \\frac{x_1 + x_2}{2}",
      style: "point",
    },
  ];
}
