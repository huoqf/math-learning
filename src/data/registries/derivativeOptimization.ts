/**
 * 导数实际生活优化建模参数注册表
 *
 * `min` / `max` **必须**取自 `OPTIMIZATION_CONSTANTS.<model>.slider`，不得手写：
 * 该区间同时是左屏滑块域、图形侧拖拽域与 math 层的数值截断边界。注册表若另写一套，
 * 拖动点就能跑到滑块读数之外（读数与图形脱节）—— 这正是「两套口径」隐雷。
 */
import { MATH_COLORS } from "@/theme";
import {
  OPTIMIZATION_CONSTANTS,
  type OptimizationModelType,
} from "@/math/derivativeOptimization";

export interface DerivativeOptimizationParams {
  modelType: OptimizationModelType;
  xVal: number;
}

export const defaultOptimizationParams: Record<string, number> = {
  box_x: 10,
  can_r: 4.5,
  profit_x: 30,
};

export const optimizationParamMeta = {
  box_x: {
    label: "剪切角边长 x (cm)",
    min: OPTIMIZATION_CONSTANTS.box.slider[0],
    max: OPTIMIZATION_CONSTANTS.box.slider[1],
    step: 0.5,
    default: 10,
    color: MATH_COLORS.paramPrimary,
    description: "正方形铁皮四角剪去的小正方形边长，即长方体盒子高",
  },
  can_r: {
    label: "底面半径 r (cm)",
    min: OPTIMIZATION_CONSTANTS.can.slider[0],
    max: OPTIMIZATION_CONSTANTS.can.slider[1],
    step: 0.2,
    default: 4.5,
    color: MATH_COLORS.paramPrimary,
    description: "圆柱体易拉罐底面圆半径",
  },
  profit_x: {
    label: "生产销售量 x (件)",
    min: OPTIMIZATION_CONSTANTS.profit.slider[0],
    max: OPTIMIZATION_CONSTANTS.profit.slider[1],
    step: 1,
    default: 30,
    color: MATH_COLORS.paramPrimary,
    description: "企业每批次生产销售的产品数量",
  },
};
