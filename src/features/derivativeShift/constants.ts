/**
 * src/features/derivativeShift/constants.ts
 * 极值点偏移与隐零点实验室常量配置
 */

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

/* 图例与画布的配色/线型统一由 scenePalette.ts 提供（唯一事实源），
   此处只做转出，便于页面按既有路径引用。 */
export { getDerivativeShiftLegendItems, getShiftPalette } from "./scenePalette";
