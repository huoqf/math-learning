/**
 * 导数四则运算法则参数注册表
 */
import { MATH_COLORS } from "@/theme";
import type { OperationType } from "@/math/derivativeOperations";

export interface DerivativeOperationsParams {
  opType: OperationType;
  x0: number;
  deltaX: number;
}

export const defaultDerivativeOperationsParams: Record<string, number> = {
  x0: 1.2,
  deltaX: 0.3,
};

export const derivativeOperationsParamMeta = {
  x0: {
    // 下界取 0 是刻意为之：商法则在 g(x) = sin x（f(x) = x）时于 x₀ = 0 处分母为零，
    // 这是页面上唯一能让学生亲眼看到「分母为 0 ⇒ 商函数无定义」的取值。
    // 若把下界卡在 0.3，该警示在结构上永不可达，右屏的 danger 条目就成了死文案。
    min: 0,
    max: 2.8,
    step: 0.1,
    label: "探究点横坐标 x₀",
    color: MATH_COLORS.paramPrimary,
  },
  deltaX: {
    min: 0.05,
    max: 1.0,
    step: 0.05,
    label: "自变量增量 Δx",
    color: MATH_COLORS.paramSecondary,
  },
};
