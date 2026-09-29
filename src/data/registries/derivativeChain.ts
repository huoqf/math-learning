/**
 * 简单复合函数求导参数注册表
 * 遵循系统公理 3：三位一体色彩映射
 */
import { MATH_COLORS } from "@/theme";

export const DERIVATIVE_CHAIN_DEFAULT_PARAMS: Record<string, number> = {
  a: 2,
  b: 1,
  x0: 0.5,
};

export const DERIVATIVE_CHAIN_PARAM_META = {
  a: {
    label: "内层系数 a",
    min: -3,
    max: 3,
    step: 0.5,
    default: 2,
    color: MATH_COLORS.paramPrimary,
    description: "内层线性拉伸系数，直接决定导数放大倍数",
  },
  b: {
    label: "内层常数 b",
    min: -4,
    max: 4,
    step: 0.5,
    default: 1,
    color: MATH_COLORS.paramSecondary,
    description: "内层平移量，控制整体图形水平平移",
  },
  x0: {
    label: "探究点 x₀",
    min: -3,
    max: 3,
    step: 0.1,
    default: 0.5,
    color: MATH_COLORS.paramTertiary,
    description: "切点自变量横坐标",
  },
};
