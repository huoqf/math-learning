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

/* ------------------------------------------------------------------ *
 * 画布 y 可见域（常量，铁律同上：绝不随参数缩放）
 *
 * 下界由隐零点消元轨迹 h(x) = -(1/2)x² - x 定死：它是一条**完全不含参数 a** 的
 * 抛物线，极值点（即隐零点）P 的纵坐标恒等于 h(x₀)、h(x₀) = f(x₀)。a 越大 x₀ 越靠右、
 * P 越深（x₀ 由超越方程 ln x₀ + x₀ + 1 = a 唯一确定）：
 *     a = 1.2 → P ≈ (0.643, -0.849)      a = 2.0 → P ≈ (1.000, -1.500)
 *     a = 2.5 → P ≈ (1.265, -2.065)      a = 3.4 → P ≈ (1.808, -3.442)
 * 已发布预设「深部隐零」(a = 3.4) 的核心结论点必须天然可见，故下界取 -3.8
 * （余量 0.358 ≈ 32px）；原值 -2.5 会把该预设的结论点裁出画布，学生点开预设只能
 * 看到一条断掉的轨迹。上界 3.5 由 x·e^{-x} 与 (ln x)/x 的极大值 1/e 及割线高度
 * k ≤ 0.35 共同决定，无需改动。
 *
 * 注意：本页 useSceneScale 未关掉 keepAspectRatio，因此 y 跨度一旦变大，比例尺会由
 * 被 x 轴锁定改为被 y 轴锁定（105px/单位 → 约 89px/单位），可见 x 域随之比
 * getShiftXRange 声明的常量略宽（[-1.5, 6.5] → 约 [-2.22, 7.22]）。
 * 契约「坐标轴不得随参数缩放」不受影响（两端都是常量），改动只发生在确有裁切的 y 轴上。
 * ------------------------------------------------------------------ */
export const SHIFT_Y_RANGE: [number, number] = [-4.0, 3.5];

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
